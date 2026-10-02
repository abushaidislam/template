import * as core from "@actions/core";
import * as github from "@actions/github";
import { generateReceipt, formatMarkdownReceipt } from "@qodewk/core";

async function run() {
  try {
    const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;
    const baseRef = core.getInput("base-ref") || undefined;
    const headSha = core.getInput("head-sha") || undefined;
    const publishCloud = core.getInput("publish-cloud") === "true";
    const apiUrl = core.getInput("api-url") || process.env.QODEWK_API_URL || "https://qodewk.flinkeo.online/api/receipts";
    const commentPr = core.getInput("comment-pr") !== "false";

    core.info("Generating Qodewk telemetry receipt...");
    const receipt = await generateReceipt({
      baseSha: baseRef,
      headSha: headSha
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.QODEWK_APP_URL || "https://qodewk.flinkeo.online";
    let publicUrl = `${baseUrl}/r/${receipt.receipt.id}`;

    if (publishCloud) {
      core.info(`Publishing privacy-safe receipt to ${apiUrl}...`);
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(receipt)
        });

        if (response.ok) {
          const data = (await response.json()) as { url: string };
          publicUrl = data.url || publicUrl;
          core.info(`Receipt published successfully: ${publicUrl}`);
        } else {
          core.warning(`Cloud API returned ${response.status}. Using default link.`);
        }
      } catch (err: any) {
        core.warning(`Could not reach cloud API: ${err.message}. Using fallback link.`);
      }
    }

    const markdown = formatMarkdownReceipt(receipt, publicUrl);

    // Set outputs
    core.setOutput("receipt-id", receipt.receipt.id);
    core.setOutput("receipt-url", publicUrl);
    core.setOutput("cost", receipt.ai.cost.toString());
    core.setOutput("tokens", (receipt.ai.tokens.input + receipt.ai.tokens.output).toString());
    core.setOutput("markdown", markdown);

    // Upsert PR comment if in PR context
    const context = github.context;
    const prNumber = context.payload.pull_request?.number;

    if (commentPr && prNumber && token) {
      try {
        const octokit = github.getOctokit(token);
        const owner = context.repo.owner;
        const repo = context.repo.repo;

        core.info(`Checking existing PR comments on #${prNumber}...`);
        const { data: comments } = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: prNumber
        });

        const existingComment = comments.find((c) =>
          c.body?.includes("<!-- QODEWK_RECEIPT_START")
        );

        if (existingComment) {
          core.info(`Updating existing sticky PR comment ${existingComment.id}...`);
          await octokit.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existingComment.id,
            body: markdown
          });
        } else {
          core.info(`Creating new sticky PR comment on #${prNumber}...`);
          await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: markdown
          });
        }
        core.info("Sticky receipt comment successfully upserted.");
      } catch (commentErr: any) {
        core.warning(`Could not post sticky comment to PR #${prNumber}: ${commentErr.message}`);
      }
    }
  } catch (error: any) {
    core.setFailed(`Qodewk Action failed: ${error.message}`);
  }
}

run();

# Qodewk

Universal telemetry and digital receipt generator for the AI coding agent era.

`qodewk` analyzes git repositories and AI tool logs (Claude Code, Cursor, Copilot, Antigravity, etc.) to harvest telemetry, calculate token usage & cost estimations, and generate verifiable digital receipts for AI-assisted software development.

---

## Workspace Structure

This monorepo consists of the following core packages and documentation web application:

- **`packages/cli`** (`qodewk`): The official CLI tool for generating receipts, displaying interactive menus, and running telemetry commands.
- **`packages/core`** (`@qodewk/core`): Core telemetry harvester, git analysis, and receipt generator logic.
- **`packages/pricing`** (`@qodewk/pricing`): Token cost estimation models for LLM models (Anthropic, OpenAI, etc.).
- **`packages/protocol`** (`@qodewk/protocol`): Types and schemas defining the Qodewk Receipt Protocol.
- **`packages/action`**: GitHub Action integration for generating Qodewk receipts in CI workflows.
- **`docs`** (root web app): Documentation & landing site built with Next.js 16, Fumadocs, and Tailwind CSS.

---

## Quick Start

### Web App & Docs Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open **[http://localhost:3000](http://localhost:3000)** to preview the site.

### CLI Usage

```bash
# Run CLI directly
npx qodewk
```

---

## Scripts

- `pnpm dev` - Start the Next.js development server
- `pnpm build` - Build all packages and web application
- `pnpm lint` - Run linter
- `pnpm typecheck` - Run TypeScript typechecks across packages

---

## License

MIT

export interface CommunityPlugin {
	name: string;
	url: string;
	description: string;
	author: {
		name: string;
		github: string;
		avatar: string;
	};
}

export const communityPlugins: CommunityPlugin[] = [
	{
		name: "@dymo-api/qodewk",
		url: "https://github.com/TPEOficial/dymo-api-qodewk",
		description:
			"Sign Up Protection and validation of disposable emails (the world's largest database with nearly 14 million entries).",
		author: {
			name: "TPEOficial",
			github: "TPEOficial",
			avatar: "https://github.com/TPEOficial.png",
		},
	},
	{
		name: "qodewk-harmony",
		url: "https://github.com/gekorm/qodewk-harmony/",
		description:
			"Email & phone normalization and additional validation, blocking over 55,000 temporary email domains.",
		author: {
			name: "GeKorm",
			github: "GeKorm",
			avatar: "https://github.com/GeKorm.png",
		},
	},
	{
		name: "validation-qodewk",
		url: "https://github.com/Daanish2003/validation-qodewk",
		description:
			"Validate API request using any validation library (e.g., Zod, Yup)",
		author: {
			name: "Daanish2003",
			github: "Daanish2003",
			avatar: "https://github.com/Daanish2003.png",
		},
	},
	{
		name: "qodewk-localization",
		url: "https://github.com/marcellosso/qodewk-localization",
		description:
			"Localize and customize qodewk messages with easy translation and message override support.",
		author: {
			name: "marcellosso",
			github: "marcellosso",
			avatar: "https://github.com/marcellosso.png",
		},
	},
	{
		name: "qodewk-attio-plugin",
		url: "https://github.com/tobimori/qodewk-attio-plugin",
		description: "Sync your products Qodewk users & workspaces with Attio",
		author: {
			name: "tobimori",
			github: "tobimori",
			avatar: "https://github.com/tobimori.png",
		},
	},
	{
		name: "qodewk-cloudflare",
		url: "https://github.com/zpg6/qodewk-cloudflare",
		description:
			"Seamlessly integrate with Cloudflare Workers, D1, Hyperdrive, KV, R2, and geolocation services. Includes CLI for project generation, automated resource provisioning on Cloudflare, and database migrations. Supports Next.js, Hono, and more!",
		author: {
			name: "zpg6",
			github: "zpg6",
			avatar: "https://github.com/zpg6.png",
		},
	},
	{
		name: "expo-qodewk-passkey",
		url: "https://github.com/kevcube/expo-qodewk-passkey",
		description:
			"qodewk client plugin for using passkeys on mobile platforms in expo apps. Supports iOS, macOS, Android (and web!) by wrapping the existing qodewk passkey client plugin.",
		author: {
			name: "kevcube",
			github: "kevcube",
			avatar: "https://github.com/kevcube.png",
		},
	},
	{
		name: "qodewk-credentials-plugin",
		url: "https://github.com/erickweil/qodewk-credentials-plugin",
		description: "LDAP authentication plugin for Qodewk.",
		author: {
			name: "erickweil",
			github: "erickweil",
			avatar: "https://github.com/erickweil.png",
		},
	},
	{
		name: "qodewk-opaque",
		url: "https://github.com/TheUntraceable/qodewk-opaque",
		description:
			"Provides database-breach resistant authentication using the zero-knowledge OPAQUE protocol.",
		author: {
			name: "TheUntraceable",
			github: "TheUntraceable",
			avatar: "https://github.com/theuntraceable.png",
		},
	},
	{
		name: "qodewk-firebase-auth",
		url: "https://github.com/yultyyev/qodewk-firebase-auth",
		description:
			"Firebase Authentication plugin for Qodewk with built-in email service, Google Sign-In, and password reset functionality.",
		author: {
			name: "yultyyev",
			github: "yultyyev",
			avatar: "https://github.com/yultyyev.png",
		},
	},
	{
		name: "qodewk-university",
		url: "https://github.com/LuyxLLC/qodewk-university",
		description:
			"University plugin for allowing only specific email domains to be passed through. Includes a University model with name and domain.",
		author: {
			name: "Fyrlex",
			github: "Fyrlex",
			avatar: "https://github.com/Fyrlex.png",
		},
	},
	{
		name: "qodewk-paystack",
		url: "https://github.com/alexasomba/qodewk-paystack",
		description:
			"Production-ready Paystack billing plugin for Qodewk with native and locally managed subscriptions, one-time payments, organization billing, trials, secure webhooks, automated limits, and more.",
		author: {
			name: "alexasomba",
			github: "alexasomba",
			avatar: "https://github.com/alexasomba.png",
		},
	},
	{
		name: "qodewk-flutterwave",
		url: "https://github.com/alexasomba/qodewk-flutterwave",
		description:
			"Flutterwave plugin for Qodewk — integrates Flutterwave payments, subscriptions, organization billing, marketplace split payments, webhooks, refunds, reconciliation, and more.",
		author: {
			name: "alexasomba",
			github: "alexasomba",
			avatar: "https://github.com/alexasomba.png",
		},
	},
	{
		name: "qodewk-solana-payments",
		url: "https://github.com/alexasomba/qodewk-solana-payments",
		description:
			"One-time Solana payment integration for Qodewk with Solana Pay checkout, server-side transfer verification, payment tracking, organization payments, and more.",
		author: {
			name: "alexasomba",
			github: "alexasomba",
			avatar: "https://github.com/alexasomba.png",
		},
	},
	{
		name: "qodewk-lark",
		url: "https://github.com/uselark/qodewk-lark",
		description:
			"Lark billing plugin that automatically creates customers and subscribes them to free plans on signup.",
		author: {
			name: "Vijit",
			github: "vijit-lark",
			avatar: "https://github.com/vijit-lark.png",
		},
	},
	{
		name: "stargate-qodewk",
		url: "https://github.com/neiii/stargate-qodewk",
		description:
			"Gate access to resources based on whether the user has starred a repository",
		author: {
			name: "neiii",
			github: "neiii",
			avatar: "https://github.com/neiii.png",
		},
	},
	{
		name: "@sequenzy/qodewk",
		url: "https://github.com/Sequenzy/sequenzy-qodewk",
		description:
			"Automatically add users to Sequenzy mailing lists on signup for seamless email marketing integration.",
		author: {
			name: "Sequenzy",
			github: "sequenzy",
			avatar: "https://sequenzy.com/logo.png",
		},
	},
	{
		name: "qodewk-nostr",
		url: "https://github.com/leon-wbr/qodewk-nostr",
		description: "Nostr authentication plugin for Qodewk (NIP-98).",
		author: {
			name: "leon-wbr",
			github: "leon-wbr",
			avatar: "https://github.com/leon-wbr.png",
		},
	},
	{
		name: "@ramiras123/qodewk-strapi",
		url: "https://github.com/Ramiras123/qodewk-strapi",
		description: "Plugin for authorization via strapi",
		author: {
			name: "Ramiras123",
			github: "ramiras123",
			avatar: "https://github.com/ramiras123.png",
		},
	},
	{
		name: "qodewk-razorpay",
		url: "https://github.com/iamjasonkendrick/qodewk-razorpay",
		description:
			"Razorpay payment plugin for Qodewk — integrates Razorpay payments, webhooks, and subscription flows.",
		author: {
			name: "iamjasonkendrick",
			github: "iamjasonkendrick",
			avatar: "https://github.com/iamjasonkendrick.png",
		},
	},
	{
		name: "qodewk-payu",
		url: "https://github.com/iamjasonkendrick/qodewk-payu",
		description:
			"PayU payment plugin for Qodewk — integrates PayU payments, webhooks, and subscription flows.",
		author: {
			name: "iamjasonkendrick",
			github: "iamjasonkendrick",
			avatar: "https://github.com/iamjasonkendrick.png",
		},
	},
	{
		name: "better-invite",
		url: "https://github.com/better-invite/better-invite",
		description:
			"Easily create and manage user invitations, allowing you to invite users with customizable settings and track usage.",
		author: {
			name: "Sandy",
			github: "0-Sandy",
			avatar: "https://github.com/0-Sandy.png",
		},
	},
	{
		name: "qodewk-usos",
		url: "https://github.com/qamarq/qodewk-usos",
		description:
			"USOS plugin for Qodewk - allows students to authenticate using their university credentials via the USOS API. Using oauth 1a.",
		author: {
			name: "qamarq",
			github: "qamarq",
			avatar: "https://github.com/qamarq.png",
		},
	},
	{
		name: "qodewk-devtools",
		url: "https://github.com/C-W-D-Harshit/qodewk-devtools",
		description:
			"A devtools panel for Qodewk that lets you create managed test users from templates, switch between sessions instantly, inspect live session data, and edit fields like roles on the fly. All from a floating React UI that only runs in development.",
		author: {
			name: "C-W-D-Harshit",
			github: "C-W-D-Harshit",
			avatar: "https://github.com/C-W-D-Harshit.png",
		},
	},
	{
		name: "qodewk-audit-logs",
		url: "https://github.com/ejirocodes/qodewk-audit-logs",
		description:
			"Audit log plugin for Qodewk. Auto-captures auth events with severity inference, PII redaction, custom storage backends, and retention policies.",
		author: {
			name: "ejirocodes",
			github: "ejirocodes",
			avatar: "https://github.com/ejirocodes.png",
		},
	},
	{
		name: "better-near-auth",
		url: "https://github.com/elliotBraem/better-near-auth",
		description:
			"Sign in with NEAR plugin with built-in gasless relay for on-chain delegate actions.",
		author: {
			name: "efiz.near",
			github: "elliotBraem",
			avatar: "https://github.com/elliotBraem.png",
		},
	},
	{
		name: "ton-qodewk",
		url: "https://github.com/mhbdev/ton-qodewk",
		description: "Sign in with Ton Connect",
		author: {
			name: "mhbdev",
			github: "mhbdev",
			avatar: "https://github.com/mhbdev.png",
		},
	},
	{
		name: "@dbsc-toolkit/qodewk",
		url: "https://www.npmjs.com/package/@dbsc-toolkit/qodewk",
		description:
			"Device Bound Session Credentials (DBSC) — binds sessions to a device-resident key so a stolen cookie can't be replayed from another machine. Native binding via TPM or Secure Enclave on Chromium 145+, with a Web Crypto polyfill for Firefox, Safari, and older Chromium.",
		author: {
			name: "SulimanAbdulrazzaq",
			github: "SulimanAbdulrazzaq",
			avatar: "https://github.com/SulimanAbdulrazzaq.png",
		},
	},
	{
		name: "@marinedotsh/qodewk-referral",
		url: "https://github.com/marinedotsh/qodewk-referral",
		description: "A Qodewk plugin for adding user referrals to your app.",
		author: {
			name: "Shivam Gupta",
			github: "shivamrun",
			avatar: "https://github.com/shivamrun.png",
		},
	},
	{
		name: "qodewk-instagram",
		url: "https://github.com/rajatsandeepsen/qodewk-instagram",
		description: "Instagram Provider for Qodewk",
		author: {
			name: "Rajat Sandeep",
			github: "rajatsandeepsen",
			avatar: "https://github.com/rajatsandeepsen.png",
		},
	},
	{
		name: "qodewk-zoho",
		url: "https://github.com/rajatsandeepsen/qodewk-zoho",
		description: "Zoho Provider for Qodewk",
		author: {
			name: "Rajat Sandeep",
			github: "rajatsandeepsen",
			avatar: "https://github.com/rajatsandeepsen.png",
		},
	},
	{
		name: "qodewk-snapchat",
		url: "https://github.com/rajatsandeepsen/qodewk-snapchat",
		description: "Snapchat Provider for Qodewk",
		author: {
			name: "Rajat Sandeep",
			github: "rajatsandeepsen",
			avatar: "https://github.com/rajatsandeepsen.png",
		},
	},
	{
		name: "better-inbox",
		url: "https://github.com/better-inbox/better-inbox",
		description:
			"In-app notifications for Qodewk apps. One plugin, one migration, one component — notifications live in your database, addressed to your users.",
		author: {
			name: "stewartjarod",
			github: "stewartjarod",
			avatar: "https://github.com/stewartjarod.png",
		},
	},
	{
		name: "qodewk-email-challenge",
		url: "https://github.com/lapluviosilla/qodewk-email-challenge",
		description:
			"Passwordless, multi-device email challenge — one challenge completable by an approval link or OTP, with browser-bound session issuance for safe cross-device sign-in.",
		author: {
			name: "lapluviosilla",
			github: "lapluviosilla",
			avatar: "https://github.com/lapluviosilla.png",
		},
	},
	{
		name: "@better-geetest/qodewk-plugin-gt4",
		url: "https://github.com/typed-sigterm/better-geetest/tree/main/packages/qodewk-plugin-gt4",
		description:
			"Integrate GeeTest gt4 bot protection by adding captcha verification for key endpoints.",
		author: {
			name: "Typed SIGTERM",
			github: "typed-sigterm",
			avatar: "https://github.com/typed-sigterm.png",
		},
	},
	{
		name: "qodewk-evp",
		url: "https://github.com/qamarq/qodewk-evp",
		description:
			"Email Verification Protocol (Chrome origin trial) plugin - lets a supporting browser verify mailbox ownership in the background and sign the user in, with automatic fallback to any other sign-in method when unsupported.",
		author: {
			name: "qamarq",
			github: "qamarq",
			avatar: "https://github.com/qamarq.png",
		},
	},
	{
		name: "@eusend_dev/qodewk",
		url: "https://github.com/eusend-dev/eusend-qodewk",
		description:
			"Auth emails (verification, password reset, OTP, magic link, organization invitations) through eusend, an EU-hosted email API, with brandable templates, non-blocking sends, and optional contact sync for verified users.",
		author: {
			name: "eusend",
			github: "eusend-dev",
			avatar: "https://github.com/eusend-dev.png",
		},
	},
	{
		name: "@stellartools/Qodewk-adapter",
		url: "https://github.com/payrouteshq/stellartools",
		description:
			"Integrate Stellar blockchain payments to your Qodewk setup.",
		author: {
			name: "Emmanuel Odii",
			github: "devodii",
			avatar: "https://github.com/devodii.png",
		},
	},
];

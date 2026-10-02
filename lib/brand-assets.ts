export const brandAssetPaths = {
	assetsZip: "/branding/qodewk-brand-assets.zip",
	mark: {
		light: {
			svg: "/branding/svg/qodewk-mark-light.svg",
			png: "/branding/png/qodewk-mark-light.png",
		},
		dark: {
			svg: "/branding/svg/qodewk-mark-dark.svg",
			png: "/branding/png/qodewk-mark-dark.png",
		},
	},
	wordmark: {
		light: {
			svg: "/branding/svg/qodewk-wordmark-light.svg",
			png: "/branding/png/qodewk-wordmark-light.png",
		},
		dark: {
			svg: "/branding/svg/qodewk-wordmark-dark.svg",
			png: "/branding/png/qodewk-wordmark-dark.png",
		},
	},
} as const;

export const brandLogoPreviews = [
	{
		label: "Mark · Light",
		src: brandAssetPaths.mark.light.svg,
		bg: "bg-black",
	},
	{
		label: "Mark · Dark",
		src: brandAssetPaths.mark.dark.svg,
		bg: "bg-white",
	},
	{
		label: "Wordmark · Light",
		src: brandAssetPaths.wordmark.light.svg,
		bg: "bg-black",
	},
	{
		label: "Wordmark · Dark",
		src: brandAssetPaths.wordmark.dark.svg,
		bg: "bg-white",
	},
] as const;

"use client";

import { TreeContextProvider } from "fumadocs-ui/contexts/tree";
import type { ReactNode } from "react";
import { usePageTree } from "./provider";

export function DocsTreeProvider({ children }: { children: ReactNode }) {
	const tree = usePageTree();
	return <TreeContextProvider tree={tree}>{children}</TreeContextProvider>;
}

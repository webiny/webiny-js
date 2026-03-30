import { createAbstraction } from "@webiny/feature/api";
import type { IContentEntryTraverser } from "./ContentEntryTraverser.js";

export interface IContentEntryTraverserProvider {
    getTraverser(modelId: string): Promise<IContentEntryTraverser>;
}

/**
 * Traverse the given content entry data using the model's AST.
 */
export const ContentEntryTraverserProvider = createAbstraction<IContentEntryTraverserProvider>(
    "ContentEntryTraverserProvider"
);

export namespace ContentEntryTraverserProvider {
    export type Interface = IContentEntryTraverserProvider;
    export type ContentEntryTraverser = IContentEntryTraverser;
}

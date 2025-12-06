import { createAbstraction } from "@webiny/feature/admin";
import type { Folder, IListCache, LoadedCache } from "~/features";

export interface IFoldersContext {
    type: string;
    modelFields: string;
}

export const FoldersContext = createAbstraction<IFoldersContext>("FoldersContext");

export namespace FoldersContext {
    export type Interface = IFoldersContext;
}

export const FoldersCache = createAbstraction<IListCache<Folder>>("FoldersCache");
export namespace FoldersCache {
    export type Interface = IListCache<Folder>;
}

export const LoadedFoldersCache = createAbstraction<LoadedCache>("LoadedFoldersCache");
export namespace LoadedFoldersCache {
    export type Interface = LoadedCache;
}

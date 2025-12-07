import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { ILoadingRepository } from "@webiny/app-utils";
import { createAbstraction } from "@webiny/feature/admin";
import type { Folder, IListCache, LoadedCache } from "~/features/index.js";

export const FolderModel = createAbstraction<CmsModel>("FolderModel");
export namespace FolderModel {
    export type Interface = CmsModel;
}

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

export const FoldersLoadingRepository = createAbstraction<ILoadingRepository>(
    "FoldersLoadingRepository"
);

export namespace FoldersLoadingRepository {
    export type Interface = ILoadingRepository;
}

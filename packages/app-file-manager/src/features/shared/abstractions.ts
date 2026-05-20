import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { FmFile } from "./types.js";

// Shared cache for file list data, used by all file CRUD repositories.
export const FilesListCache = createAbstraction<IListCache<FmFile>>("FilesListCache");

export namespace FilesListCache {
    export type Interface = IListCache<FmFile>;
}

export interface IFileFieldsProvider {
    execute(): Promise<string[]>;
}

export const FileFieldsProvider = createAbstraction<IFileFieldsProvider>("FileFieldsProvider");

export namespace FileFieldsProvider {
    export type Interface = IFileFieldsProvider;
}

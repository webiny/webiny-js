import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

// Use Case

export interface IGetFolderExtensionsFieldsUseCase {
    execute(): Promise<CmsModelField[]>;
}

export const GetFolderExtensionsFieldsUseCase =
    createAbstraction<IGetFolderExtensionsFieldsUseCase>("GetFolderExtensionsFieldsUseCase");

export namespace GetFolderExtensionsFieldsUseCase {
    export type Interface = IGetFolderExtensionsFieldsUseCase;
}

// Field Filter

export interface IFolderExtensionsFieldFilter {
    filter: (fields: CmsModelField[]) => CmsModelField[];
}

export const FolderExtensionsFieldFilter = createAbstraction<IFolderExtensionsFieldFilter>(
    "FolderExtensionsFieldFilter"
);

export namespace FolderExtensionsFieldFilter {
    export type Interface = IFolderExtensionsFieldFilter;
}

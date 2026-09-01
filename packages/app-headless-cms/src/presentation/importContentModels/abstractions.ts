import { createAbstraction } from "@webiny/feature/admin";
import type { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { ImportGroupData, ImportModelData } from "./types.js";

export interface IImportContentModelsPresenterViewModel {
    data: { groups: CmsGroup[]; models: CmsModel[] } | null;
    loading: boolean;
    groups: ImportGroupData[];
    models: ImportModelData[];
    file: File | null;
    errors: string[];
    validated: boolean;
}

export interface IImportContentModelsPresenter {
    readonly vm: IImportContentModelsPresenterViewModel;
    hasSelected(): boolean;
    isModelSelected(item: Pick<ImportModelData, "id">): boolean;
    isModelRelated(item: Pick<ImportModelData, "id">): boolean;
    onFile(file: File): void;
    onFileError(error: string): void;
    toggleModel(item: Pick<ImportModelData, "id" | "name" | "related">): void;
    handleModelsValidation(): Promise<void>;
    handleModelsImport(): Promise<void>;
    reset(): void;
}

export const ImportContentModelsPresenter = createAbstraction<IImportContentModelsPresenter>(
    "CmsImportContentModels/Presenter"
);

export namespace ImportContentModelsPresenter {
    export type Interface = IImportContentModelsPresenter;
    export type ViewModel = IImportContentModelsPresenterViewModel;
}

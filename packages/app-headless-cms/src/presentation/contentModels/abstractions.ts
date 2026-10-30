import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { CmsGroup, CmsModel } from "~/types.js";
import type { DeleteModelResult } from "~/features/model/deleteModel/abstractions.js";

export interface IContentModelsPresenterViewModel {
    loading: boolean;
    models: CmsModel[];
}

export interface IContentModelsPresenterExportModelsResponse {
    groups: CmsGroup[];
    models: CmsModel[];
}

export interface IContentModelsPresenter {
    readonly vm: IContentModelsPresenterViewModel;
    readonly list: IListPresenter<CmsModel>;
    init(): void;
    deleteModel(modelId: string, confirmation: string): Promise<DeleteModelResult>;
    cancelDelete(modelId: string): Promise<void>;
    exportModels(modelIds?: string[]): Promise<IContentModelsPresenterExportModelsResponse | null>;
}

export const ContentModelsPresenter = createAbstraction<IContentModelsPresenter>(
    "CmsContentModels/Presenter"
);

export namespace ContentModelsPresenter {
    export type Interface = IContentModelsPresenter;
    export type ViewModel = IContentModelsPresenterViewModel;
    export type ExportModelResponse = IContentModelsPresenterExportModelsResponse;
}

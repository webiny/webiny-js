import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { CmsGroup, CmsModel } from "~/types.js";
import type { DeleteModelResult } from "~/features/model/deleteModel/abstractions.js";

export interface IContentModelsPresenterExportModelsResponse {
    groups: CmsGroup[];
    models: CmsModel[];
}

export interface IContentModelsPresenter {
    readonly list: IListPresenter<CmsModel>;
    init(): void;
    /** Stops telling the assistant about the models list. */
    dispose(): void;
    deleteModel(modelId: string, confirmation: string): Promise<DeleteModelResult>;
    cancelDelete(modelId: string): Promise<void>;
    exportModels(modelIds?: string[]): Promise<IContentModelsPresenterExportModelsResponse | null>;
}

export const ContentModelsPresenter = createAbstraction<IContentModelsPresenter>(
    "CmsContentModels/Presenter"
);

export namespace ContentModelsPresenter {
    export type Interface = IContentModelsPresenter;
    export type ExportModelResponse = IContentModelsPresenterExportModelsResponse;
}

import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

/**
 * PublicModelProvider - provides public models from all registered builders
 */
export interface IPublicModelProvider {
    getModels(): Promise<CmsModel[]>;
}

export const PublicModelProvider = createAbstraction<IPublicModelProvider>("PublicModelProvider");
export namespace PublicModelProvider {
    export type Interface = IPublicModelProvider;
}

/**
 * PrivateModelProvider - provides private models from all registered builders
 */
export interface IPrivateModelProvider {
    getModels(): Promise<CmsModel[]>;
}

export const PrivateModelProvider =
    createAbstraction<IPrivateModelProvider>("PrivateModelProvider");

export namespace PrivateModelProvider {
    export type Interface = IPrivateModelProvider;
}

/**
 * ModelsProvider - combines public and private model providers
 */
export interface IModelsProvider {
    list(tenant: string): Promise<CmsModel[]>;
}

export const ModelsProvider = createAbstraction<IModelsProvider>("ModelsProvider");
export namespace ModelsProvider {
    export type Interface = IModelsProvider;
}

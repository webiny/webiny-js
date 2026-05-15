import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

/**
 * ModelsProvider - unified provider for all models (public and private)
 */
export interface IModelsProvider {
    list(tenant: string): Promise<CmsModel[]>;
}

export const ModelsProvider = createAbstraction<IModelsProvider>("ModelsProvider");
export namespace ModelsProvider {
    export type Interface = IModelsProvider;
}

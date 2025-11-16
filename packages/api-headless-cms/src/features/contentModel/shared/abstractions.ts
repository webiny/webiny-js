import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsModelAst } from "~/types/index.js";
import type { ICache } from "~/utils/caching/types.js";

/**
 * PluginModelsProvider provides access to plugin-defined (code) models.
 */
export interface IPluginModelsProvider {
    list(tenant: string): Promise<CmsModel[]>;
}

export const PluginModelsProvider =
    createAbstraction<IPluginModelsProvider>("PluginModelsProvider");

export namespace PluginModelsProvider {
    export type Interface = IPluginModelsProvider;
}

export const ModelCache = createAbstraction<ICache<Promise<CmsModel[]>>>("ModelCache");

export namespace ModelCache {
    export type Interface = ICache<Promise<CmsModel[]>>;
}

/**
 * Convert model to AST
 */
export interface IModelToAstConverter {
    toAST(model: CmsModel): CmsModelAst;
}

export const ModelToAstConverter = createAbstraction<IModelToAstConverter>("ModelToAstConverter");

export namespace ModelToAstConverter {
    export type Interface = IModelToAstConverter;
}

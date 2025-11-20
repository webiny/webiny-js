import type { CmsModel, CmsModelAst } from "~/types/index.js";
import { createAbstraction } from "@webiny/feature/createAbstraction.js";

/**
 * Convert model to AST
 */
export interface IModelToAstConverter {
    toAst(model: CmsModel): CmsModelAst;
}

export const ModelToAstConverter = createAbstraction<IModelToAstConverter>("ModelToAstConverter");

export namespace ModelToAstConverter {
    export type Interface = IModelToAstConverter;
}

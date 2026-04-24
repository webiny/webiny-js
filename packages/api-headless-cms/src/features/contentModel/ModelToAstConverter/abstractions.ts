import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsModelAst } from "~/types/index.js";

/**
 * Convert model to AST
 */
export interface IModelToAstConverter {
    toAst(model: CmsModel): CmsModelAst;
}

export const ModelToAstConverter = createAbstraction<IModelToAstConverter>("ModelToAstConverter");

export namespace ModelToAstConverter {
    export type Interface = IModelToAstConverter;
    export type Return = CmsModelAst;
}

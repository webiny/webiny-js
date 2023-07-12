import { CmsModel } from "@webiny/app-headless-cms-common/types";

/**
 * Check if model have at least one lexical single/multiple field
 */
export const modelHasLexicalField = (model: CmsModel): boolean => {
    return model.fields.some(field => field.renderer.name.startsWith("lexical-"));
};

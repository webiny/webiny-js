import { CmsModel } from "@webiny/app-headless-cms-common/types";

export const modelHasLexicalField = (model: CmsModel): boolean => {
    return model.fields.some(field => field.renderer.name.startsWith("lexical-"));
};

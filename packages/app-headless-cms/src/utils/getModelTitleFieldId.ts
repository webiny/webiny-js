import { CmsEditorContentModel } from "~/types";

export const getModelTitleFieldId = (model: CmsEditorContentModel): string => {
    if (!model.titleFieldId || model.titleFieldId === "id") {
        return "";
    }
    return model.titleFieldId;
};

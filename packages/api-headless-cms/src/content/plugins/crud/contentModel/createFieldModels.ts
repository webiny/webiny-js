import {
    CmsContentModelFieldType,
    CmsContentModelType,
    CmsContentModelUpdateInputType
} from "@webiny/api-headless-cms/types";
import { ContentModelFieldModel } from "./models";

export const createFieldModels = async (
    model: CmsContentModelType,
    data: CmsContentModelUpdateInputType
): Promise<CmsContentModelFieldType[]> => {
    const fields = [];
    for (const field of data.fields) {
        const fieldData = new ContentModelFieldModel().populate(field);
        await fieldData.validate();

        const obj: CmsContentModelFieldType = {
            id: field.id,
            fieldId: field.fieldId,
            label: field.label,
            helpText: field.helpText,
            multipleValues: field.multipleValues,
            settings: field.settings,
            type: field.type,
            validation: field.validation
        };
        fields.push(obj);
    }
    return fields;
};

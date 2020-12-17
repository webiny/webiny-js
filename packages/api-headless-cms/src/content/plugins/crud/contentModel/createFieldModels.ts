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
    const fields: CmsContentModelFieldType[] = [];
    for (const field of data.fields) {
        const fieldData = new ContentModelFieldModel().populate(field);
        await fieldData.validate();
        fields.push(await fieldData.toJSON());
    }
    return fields;
};

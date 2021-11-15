import { CmsModelField, CmsModel, CmsModelUpdateInput } from "~/types";
import { ContentModelFieldModel } from "./models";

export const createFieldModels = async (
    _: CmsModel,
    data: CmsModelUpdateInput
): Promise<CmsModelField[]> => {
    const fields: CmsModelField[] = [];
    for (const field of data.fields) {
        const fieldData = new ContentModelFieldModel().populate(field);
        await fieldData.validate();
        fields.push(await fieldData.toJSON());
    }
    return fields;
};

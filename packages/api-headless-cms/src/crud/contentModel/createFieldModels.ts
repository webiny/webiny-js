import { CmsModelField, CmsModelFieldInput } from "~/types";
import { ContentModelFieldModel } from "./models";

export const createFieldModels = async (input?: CmsModelFieldInput[]): Promise<CmsModelField[]> => {
    if (!input || input.length === 0) {
        return [];
    }
    const fields: CmsModelField[] = [];
    for (const field of input) {
        const fieldData = new ContentModelFieldModel().populate(field);
        await fieldData.validate();
        fields.push(await fieldData.toJSON());
    }
    return fields;
};

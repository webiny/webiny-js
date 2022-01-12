import WebinyError from "@webiny/error";
import { CmsModelField, CmsModel, CmsModelUpdateInput } from "~/types";
import { ContentModelFieldModel } from "./models";

export const createFieldModels = async (
    model: CmsModel,
    data: CmsModelUpdateInput
): Promise<CmsModelField[]> => {
    /**
     * We must verify that there are no two same aliases in the fields.
     */
    const aliases: string[] = [];
    const fieldIdList: string[] = [];
    const fields: CmsModelField[] = [];
    for (const input of data.fields) {
        const data = new ContentModelFieldModel().populate(input);
        await data.validate();
        const field = await data.toJSON();
        if (fieldIdList.includes(data.fieldId) === true) {
            throw new WebinyError(
                `Field ID "${data.fieldId}" cannot be used more than once in model fields.`,
                "ALIAS_ERROR",
                {
                    model: model.modelId,
                    field: field
                }
            );
        }
        fieldIdList.push(data.fieldId);
        const alias = String(field.alias || "").trim();
        if (!!alias) {
            if (aliases.includes(alias) === true) {
                throw new WebinyError(
                    `Alias "${alias}" cannot be used more than once in model fields.`,
                    "ALIAS_ERROR",
                    {
                        model: model.modelId,
                        alias,
                        field: field
                    }
                );
            }
            aliases.push(alias);
        }
        fields.push(field);
    }
    return fields;
};

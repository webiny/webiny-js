import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";

export interface CreateFormStatsTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

export const createFormStatsTypeDefs = (params: CreateFormStatsTypeDefsParams): string => {
    const { model, models, plugins: fieldTypePlugins } = params;
    const { fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });

    const excludeFormStatsFields = ["id", "formVersion"];

    const formOverallStatsFieldTypes = renderFields({
        models,
        model,
        fields: model.fields.filter(field => !excludeFormStatsFields.includes(field.fieldId)),
        type: "manage",
        fieldTypePlugins
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}

        type FbFormStats {
            id: ID!
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        type FbFormOverallStats {
            ${formOverallStatsFieldTypes.map(f => f.fields).join("\n")}
        }

        type FbFormStatsResponse {
            data: FbFormStats
            error: FbError
        }

        type FbFormOverallStatsResponse {
            data: FbFormOverallStats
            error: FbError
        }

        extend type FbQuery {
            getFormStats(formId: ID!): FbFormStatsResponse
            getFormOverallStats(formId: ID!): FbFormOverallStatsResponse
        }
    `;
};

import { AcoContext } from "~/types";
import { CmsFieldTypePlugins, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";

export const createSchema = async (context: AcoContext) => {
    const apps = context.aco.listApps();

    const plugins = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce<CmsFieldTypePlugins>((fields, plugin) => {
            fields[plugin.fieldType] = plugin;
            return fields;
        }, {});
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            return !model.isPrivate;
        });
    });

    return apps.map(app => {
        const apiName = app.model.singularApiName;

        const fields = renderFields({
            models,
            model: app.model,
            fields: app.getFields(),
            type: "manage",
            fieldTypePlugins: plugins
        });
        const inputFields = renderInputFields({
            models,
            model: app.model,
            fields: app.getFields(),
            fieldTypePlugins: plugins
        });

        return /* GraphQL */ `
            type ${apiName}SearchRecordData {
            ${fields.map(f => f.fields).join("\n")}
            }

            type ${apiName}SearchRecord {
            id: ID!
            type: String!
            location: AcoSearchLocationType!
            title: String!
            content: String
            data: ${apiName}SearchRecordData!
            tags: [String!]!
            savedOn: DateTime
            createdOn: DateTime
            createdBy: AcoUser
            }

            ${inputFields.map(f => f.typeDefs).join("\n")}

            input ${apiName}SearchRecordDataInput {
            ${inputFields}
            ${inputFields.map(f => f.fields).join("\n")}
            }

            input ${apiName}SearchRecordCreateInput {
            id: String!
            type: String!
            title: String!
            content: String
            location: AcoSearchLocationInput!
            data: ${apiName}SearchRecordDataInput!
            tags: [String!]
            }

            input ${apiName}SearchRecordUpdateInput {
            title: String
            content: String
            location: AcoSearchLocationInput
            data: ${apiName}SearchRecordDataInput
            tags: [String!]
            }

            input ${apiName}SearchRecordListWhereInput {
            type: String!
            location: AcoSearchLocationInput
            tags_in: [String!]
            tags_startsWith: String
            tags_not_startsWith: String
            }

            type ${apiName}SearchRecordResponse {
            data: ${apiName}SearchRecord
            error: AcoError
            }

            type ${apiName}SearchRecordListResponse {
            data: [${apiName}SearchRecord!]
            error: AcoError
            meta: AcoMeta
            }

            extend type SearchQuery {
            get${apiName}Record(id: ID!): ${apiName}SearchRecordResponse
            list${apiName}Records(
            where: ${apiName}SearchRecordListWhereInput
            search: String
            limit: Int
            after: String
            sort: AcoSort
            ): ${apiName}SearchRecordListResponse
            }

            extend type SearchMutation {
            create${apiName}Record(data: SearchRecordCreateInput!): ${apiName}SearchRecordResponse
            update${apiName}Record(id: ID!, data: SearchRecordUpdateInput!): ${apiName}SearchRecordResponse
            delete${apiName}Record(id: ID!): AcoBooleanResponse
            }
        `;
    });
};

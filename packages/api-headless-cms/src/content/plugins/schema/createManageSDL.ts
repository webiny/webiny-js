import pluralize from "pluralize";
import { CmsFieldTypePlugins, CmsContext, CmsContentModel } from "@webiny/api-headless-cms/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { renderInputFields } from "../utils/renderInputFields";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";

export interface CreateManageSDL {
    (params: {
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const createManageSDL: CreateManageSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    const listFilterFieldsRender = renderListFilterFields({
        model,
        type: "manage",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({ model, fieldTypePlugins });
    const getFilterFieldsRender = renderGetFilterFields({ model, fieldTypePlugins });
    const inputFieldsRender = renderInputFields({ model, fieldTypePlugins });
    const fields = renderFields({ model, type: "manage", fieldTypePlugins });

    return /* GraphQL */ `
        "${model.description}"
        ${fields
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}
        type ${mTypeName} {
            id: ID
            createdOn: DateTime
            updatedOn: DateTime
            savedOn: DateTime
            meta: ${mTypeName}Meta
            ${fields.map(f => f.fields).join("\n")}
        }

        type ${mTypeName}Meta {
            model: String
            environment: ID
            parent: ID
            version: Int
            latestVersion: Boolean
            locked: Boolean
            published: Boolean
            publishedOn: DateTime
            status: String
            revisions: [${mTypeName}]
            title: CmsText
        }

        ${inputFieldsRender &&
            `input ${mTypeName}Input {
            ${inputFieldsRender}
        }`}

        ${getFilterFieldsRender &&
            `input ${mTypeName}GetWhereInput {
            ${getFilterFieldsRender}
        }`}


        ${listFilterFieldsRender &&
            `input ${mTypeName}ListWhereInput {
            ${listFilterFieldsRender}
        }`}

        ${getFilterFieldsRender &&
            `input ${mTypeName}UpdateWhereInput {
            ${getFilterFieldsRender}
        }`}

              ${getFilterFieldsRender &&
                  `input ${mTypeName}DeleteWhereInput {
            ${getFilterFieldsRender}
        }`}

        type ${mTypeName}Response {
            data: ${mTypeName}
            error: CmsError
        }

        type ${mTypeName}ListResponse {
            data: [${mTypeName}]
            meta: CmsListMeta
            error: CmsError
        }

        ${sortEnumRender &&
            `enum ${mTypeName}ListSorter {
            ${sortEnumRender}
        }`}

        extend type Query {
            get${typeName}(where: ${mTypeName}GetWhereInput!): ${mTypeName}Response

            list${pluralize(typeName)}(
                where: ${mTypeName}ListWhereInput
                sort: [${mTypeName}ListSorter]
                limit: Int
                after: String
                before: String
            ): ${mTypeName}ListResponse
        }

        extend type Mutation{
            create${typeName}(data: ${mTypeName}Input!): ${mTypeName}Response

            create${typeName}From(revision: ID!, data: ${mTypeName}Input): ${mTypeName}Response

            update${typeName}(where: ${mTypeName}UpdateWhereInput!, data: ${mTypeName}Input!): ${mTypeName}Response

            delete${typeName}(where: ${mTypeName}DeleteWhereInput!): CmsDeleteResponse

            publish${typeName}(revision: ID!): ${mTypeName}Response

            unpublish${typeName}(revision: ID!): ${mTypeName}Response
        }
    `;
};

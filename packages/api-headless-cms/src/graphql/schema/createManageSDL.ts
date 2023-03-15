import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { renderInputFields } from "~/utils/renderInputFields";
import { renderFields } from "~/utils/renderFields";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";

interface CreateManageSDLParams {
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}

interface CreateManageSDL {
    (params: CreateManageSDLParams): string;
}

export const createManageSDL: CreateManageSDL = ({
    model,
    fieldTypePlugins,
    sorterPlugins
}): string => {
    const listFilterFieldsRender = renderListFilterFields({
        model,
        type: "manage",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({ model, fieldTypePlugins, sorterPlugins });
    const getFilterFieldsRender = renderGetFilterFields({ model, fieldTypePlugins });
    const inputFields = renderInputFields({ model, fieldTypePlugins });
    const fields = renderFields({ model, type: "manage", fieldTypePlugins });

    if (inputFields.length === 0) {
        return "";
    }

    return /* GraphQL */ `
        """${model.description || model.modelId}"""
        type ${model.singularApiName} {
            id: ID!
            entryId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsCreatedBy!
            ownedBy: CmsOwnedBy!
            meta: ${model.singularApiName}Meta
            ${fields.map(f => f.fields).join("\n")}
        }

        type ${model.singularApiName}Meta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [${model.singularApiName}]
        title: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
        }

        ${fields
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}

        ${inputFields
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}

        ${
            inputFields &&
            `input ${model.singularApiName}Input {
                id: ID
            ${inputFields.map(f => f.fields).join("\n")}
        }`
        }

        ${
            getFilterFieldsRender &&
            `input ${model.singularApiName}GetWhereInput {
            ${getFilterFieldsRender}
        }`
        }


        ${
            listFilterFieldsRender &&
            `input ${model.singularApiName}ListWhereInput {
                ${listFilterFieldsRender}
                AND: [${model.singularApiName}ListWhereInput!]
                OR: [${model.singularApiName}ListWhereInput!]
        }`
        }

        type ${model.singularApiName}Response {
        data: ${model.singularApiName}
        error: CmsError
        }

        type ${model.singularApiName}ArrayResponse {
        data: [${model.singularApiName}]
        error: CmsError
        }

        type ${model.singularApiName}ListResponse {
        data: [${model.singularApiName}]
        meta: CmsListMeta
        error: CmsError
        }

        ${
            sortEnumRender &&
            `enum ${model.singularApiName}ListSorter {
            ${sortEnumRender}
        }`
        }

        extend type Query {
        get${model.singularApiName}(revision: ID, entryId: ID, status: CmsEntryStatusType): ${
        model.singularApiName
    }Response

        get${model.singularApiName}Revisions(id: ID!): ${model.singularApiName}ArrayResponse

        get${model.pluralApiName}ByIds(revisions: [ID!]!): ${model.singularApiName}ArrayResponse

        list${model.pluralApiName}(
        where: ${model.singularApiName}ListWhereInput
        sort: [${model.singularApiName}ListSorter]
        limit: Int
        after: String
        ): ${model.singularApiName}ListResponse
        }

        extend type Mutation{
        create${model.singularApiName}(data: ${model.singularApiName}Input!): ${
        model.singularApiName
    }Response

        create${model.singularApiName}From(revision: ID!, data: ${model.singularApiName}Input): ${
        model.singularApiName
    }Response

        update${model.singularApiName}(revision: ID!, data: ${model.singularApiName}Input!): ${
        model.singularApiName
    }Response

        delete${model.singularApiName}(revision: ID!): CmsDeleteResponse

        publish${model.singularApiName}(revision: ID!): ${model.singularApiName}Response

        republish${model.singularApiName}(revision: ID!): ${model.singularApiName}Response

        unpublish${model.singularApiName}(revision: ID!): ${model.singularApiName}Response
        }
    `;
};

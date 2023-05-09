import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { renderInputFields } from "~/utils/renderInputFields";
import { renderFields } from "~/utils/renderFields";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";

interface CreateManageSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}

interface CreateManageSDL {
    (params: CreateManageSDLParams): string;
}

export const createManageSDL: CreateManageSDL = ({
    models,
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
    const inputFields = renderInputFields({ models, model, fieldTypePlugins });
    const fields = renderFields({ models, model, type: "manage", fieldTypePlugins });

    if (inputFields.length === 0) {
        return "";
    }

    const { singularApiName: singularName, pluralApiName: pluralName } = model;

    return /* GraphQL */ `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsIdentity!
            ownedBy: CmsIdentity!
            modifiedBy: CmsIdentity
            meta: ${singularName}Meta
            ${fields.map(f => f.fields).join("\n")}
        }

        type ${singularName}Meta {
            modelId: String
            version: Int
            locked: Boolean
            publishedOn: DateTime
            status: String
            """
            CAUTION: this field is resolved by making an extra query to DB.
            RECOMMENDATION: Use it only with "get" queries (avoid in "list")
            """
            revisions: [${singularName}!]
            title: String
            description: String
            image: String
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
            `input ${singularName}Input {
                id: ID
            ${inputFields.map(f => f.fields).join("\n")}
        }`
        }

        ${
            getFilterFieldsRender &&
            `input ${singularName}GetWhereInput {
            ${getFilterFieldsRender}
        }`
        }


        ${
            listFilterFieldsRender &&
            `input ${singularName}ListWhereInput {
                ${listFilterFieldsRender}
                AND: [${singularName}ListWhereInput!]
                OR: [${singularName}ListWhereInput!]
        }`
        }

        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }

        type ${singularName}ArrayResponse {
            data: [${singularName}]
            error: CmsError
        }

        type ${singularName}ListResponse {
            data: [${singularName}]
            meta: CmsListMeta
            error: CmsError
        }

        ${
            sortEnumRender &&
            `enum ${singularName}ListSorter {
            ${sortEnumRender}
        }`
        }

        extend type Query {
            get${singularName}(revision: ID, entryId: ID, status: CmsEntryStatusType): ${singularName}Response
    
            get${singularName}Revisions(id: ID!): ${singularName}ArrayResponse
    
            get${pluralName}ByIds(revisions: [ID!]!): ${singularName}ArrayResponse
    
            list${pluralName} (
                where: ${singularName}ListWhereInput
                sort: [${singularName}ListSorter]
                limit: Int
                after: String
            ): ${singularName}ListResponse
        }

        extend type Mutation {
            create${singularName}(data: ${singularName}Input!): ${singularName}Response
    
            create${singularName}From(revision: ID!, data: ${singularName}Input): ${singularName}Response
    
            update${singularName}(revision: ID!, data: ${singularName}Input!): ${singularName}Response
    
            delete${singularName}(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse
    
            publish${singularName}(revision: ID!): ${singularName}Response
    
            republish${singularName}(revision: ID!): ${singularName}Response
    
            unpublish${singularName}(revision: ID!): ${singularName}Response
        }
    `;
};

import { CmsFieldTypePlugins, CmsContentModel } from "~/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { renderInputFields } from "../utils/renderInputFields";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

interface CreateManageSDL {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
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
    const inputFields = renderInputFields({ model, fieldTypePlugins });
    const fields = renderFields({ model, type: "manage", fieldTypePlugins });

    return /* GraphQL */ `
        """${model.description}"""
        ${fields
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}

        type ${mTypeName} {
            id: ID!
            entryId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsCreatedBy!
            ownedBy: CmsOwnedBy!
            meta: ${mTypeName}Meta
            ${fields.map(f => f.fields).join("\n")}
        }

        type ${mTypeName}Meta {
            modelId: String
            version: Int
            locked: Boolean
            publishedOn: DateTime
            status: String
            """
            CAUTION: this field is resolved by making an extra query to DB. 
            RECOMMENDATION: Use it only with "get" queries (avoid in "list") 
            """
            revisions: [${mTypeName}]
            title: String
        }
        
                    
        ${inputFields
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}

        ${inputFields &&
            `input ${mTypeName}Input {
            ${inputFields.map(f => f.fields).join("\n")}
        }`}

        ${getFilterFieldsRender &&
            `input ${mTypeName}GetWhereInput {
            ${getFilterFieldsRender}
        }`}


        ${listFilterFieldsRender &&
            `input ${mTypeName}ListWhereInput {
            ${listFilterFieldsRender}
        }`}

        type ${mTypeName}Response {
            data: ${mTypeName}
            error: CmsError
        }
        
        type ${mTypeName}ArrayResponse {
            data: [${mTypeName}]
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
            get${typeName}(revision: ID!): ${mTypeName}Response
            
            get${typeName}Revisions(id: ID!): ${mTypeName}ArrayResponse
            
            get${pluralizedTypeName(typeName)}ByIds(revisions: [ID!]!): ${mTypeName}ArrayResponse

            list${pluralizedTypeName(typeName)}(
                where: ${mTypeName}ListWhereInput
                sort: [${mTypeName}ListSorter]
                limit: Int
                after: String
            ): ${mTypeName}ListResponse
        }

        extend type Mutation{
            create${typeName}(data: ${mTypeName}Input!): ${mTypeName}Response

            create${typeName}From(revision: ID!, data: ${mTypeName}Input): ${mTypeName}Response

            update${typeName}(revision: ID!, data: ${mTypeName}Input!): ${mTypeName}Response

            delete${typeName}(revision: ID!): CmsDeleteResponse

            publish${typeName}(revision: ID!): ${mTypeName}Response

            unpublish${typeName}(revision: ID!): ${mTypeName}Response
            
            request${typeName}Review(revision: ID!): ${mTypeName}Response
            
            request${typeName}Changes(revision: ID!): ${mTypeName}Response
        }
    `;
};

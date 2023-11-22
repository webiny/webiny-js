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
    const inputFields = renderInputFields({
        models,
        model,
        fields: model.fields,
        fieldTypePlugins
    });
    if (inputFields.length === 0) {
        return "";
    }
    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldTypePlugins,
        sorterPlugins
    });
    const getFilterFieldsRender = renderGetFilterFields({
        fields: model.fields,
        fieldTypePlugins
    });

    const fields = renderFields({
        models,
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins
    });

    const { singularApiName: singularName, pluralApiName: pluralName } = model;

    const inputGraphQLFields = inputFields.map(f => f.fields).join("\n");
    /**
     * TODO check for 5.38.0
     */
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
            # Advanced Content Organization - make required in 5.38.0
            wbyAco_location: WbyAcoLocation
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

        ${fields.map(f => f.typeDefs).join("\n")}

        ${inputFields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}Input {
            id: ID
            createdOn: DateTime
            savedOn: DateTime
            publishedOn: DateTime
            wbyAco_location: WbyAcoLocationInput
            ${inputGraphQLFields}
        }

        input ${singularName}GetWhereInput {
            ${getFilterFieldsRender}
        }

        input ${singularName}ListWhereInput {
            wbyAco_location: WbyAcoLocationWhereInput
            ${listFilterFieldsRender}
            AND: [${singularName}ListWhereInput!]
            OR: [${singularName}ListWhereInput!]
        }


        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
        
        type ${singularName}MoveResponse {
            data: Boolean
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


        enum ${singularName}ListSorter {
            ${sortEnumRender}
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
                search: String
            ): ${singularName}ListResponse
        }

        extend type Mutation {
            create${singularName}(data: ${singularName}Input!, options: CreateCmsEntryOptionsInput): ${singularName}Response

            create${singularName}From(revision: ID!, data: ${singularName}Input, options: CreateRevisionCmsEntryOptionsInput): ${singularName}Response
    
            update${singularName}(revision: ID!, data: ${singularName}Input!, options: UpdateCmsEntryOptionsInput): ${singularName}Response

            validate${singularName}(revision: ID, data: ${singularName}Input!): CmsEntryValidationResponse!
            
            move${singularName}(revision: ID!, folderId: ID!): ${singularName}MoveResponse

            delete${singularName}(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse

            deleteMultiple${pluralName}(entries: [ID!]!): CmsDeleteMultipleResponse!
    
            publish${singularName}(revision: ID!): ${singularName}Response
    
            republish${singularName}(revision: ID!): ${singularName}Response
    
            unpublish${singularName}(revision: ID!): ${singularName}Response
        }
    `;
};

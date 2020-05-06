import { GraphQLFieldResolver, GraphQLSchemaPlugin } from "@webiny/graphql/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveUpdate,
    emptyResolver
} from "@webiny/commodo-graphql";
import gql from "graphql-tag";
import merge from "lodash.merge";
import { hasScope } from "@webiny/api-security";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { i18nFieldType } from "./graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./graphqlTypes/i18nFieldInput";
import contentModelGroup from "./graphql/contentModelGroup";
import meta from "./graphql/meta";
import createRevisionFrom from "./graphql/contentModel/resolvers/createRevisionFrom";
import listContentModels from "./graphql/contentModel/resolvers/listContentModels";

const contentModelFetcher = ctx => ctx.models.CmsContentModel;

const publishContentModel: GraphQLFieldResolver<any, any> = (_, args, ctx, info) => {
    args.data = { published: true };

    return resolveUpdate(contentModelFetcher)(_, args, ctx, info);
};

const getMutations = type => {
    if (type === "manage") {
        return `
            createContentModel(data: CmsContentModelInput!): CmsContentModelResponse
            updateContentModel(
                id: ID!
                data: CmsContentModelInput!
            ): CmsContentModelResponse

            deleteContentModel(id: ID!): CmsDeleteResponse
            
            # Publish revision
            publishContentModel(
                id: ID!
            ): CmsContentModelResponse
            
            # Create a new revision from an existing revision
            createRevisionFrom(
                revision: ID!
            ): CmsContentModelResponse
        `;
    }

    return "_empty: String";
};

const getMutationResolvers = type => {
    if (type === "manage") {
        return {
            createContentModel: resolveCreate(contentModelFetcher),
            updateContentModel: resolveUpdate(contentModelFetcher),
            deleteContentModel: resolveDelete(contentModelFetcher),
            // Publish revision (must be given an exact revision ID to publish)
            publishContentModel,
            createRevisionFrom
        };
    }

    return {
        _empty: emptyResolver
    };
};

const getQueryResolvers = () => {
    return {
        getContentModel: hasScope("cms:content-model:crud")(resolveGet(contentModelFetcher)),
        listContentModels: hasScope("cms:content-model:crud")(listContentModels)
    };
};

export default ({ type }) => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        prepare({ context }) {
            return generateSchemaPlugins({ context });
        },
        schema: {
            typeDefs: gql`
                ${i18nFieldType("CmsString", "String")}
                ${i18nFieldInput("CmsString", "String")}

                input CmsSearchInput {
                    query: String
                    fields: [String]
                    operator: String
                }
                
                ${contentModelGroup.getTypeDefs(type)}
                ${meta.typeDefs}
                
                type SecurityUser {
                    id: ID
                    firstName: String
                    lastName: String
                }

                type CmsError {
                    code: String
                    message: String
                    data: JSON
                }

                type CmsCursors {
                    next: String
                    previous: String
                }
                
                type CmsListMeta {
                    cursors: CmsCursors
                    hasNextPage: Boolean
                    hasPreviousPage: Boolean
                    totalCount: Int
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                enum CmsContentModelStatusEnum {
                    published
                    draft
                    locked
                }

                type CmsContentModel {
                    id: ID
                    title: String
                    modelId: String
                    group: CmsContentModelGroup
                    description: String
                    layout: [[String]]
                    createdOn: DateTime
                    savedOn: DateTime
                    createdBy: SecurityUser
                    titleFieldId: String
                    fields: [CmsContentModelField]
                    publishedOn: DateTime
                    published: Boolean
                    locked: Boolean
                    status: CmsContentModelStatusEnum
                    version: Int
                    parent: ID
                    revisions: [CmsContentModel]
                }

                input CmsContentModelInput {
                    group: ID
                    title: String
                    modelId: String
                    description: String
                    titleFieldId: String
                    fields: [CmsContentModelFieldInput]
                    layout: [[String]]
                }

                input CmsFieldValidationInput {
                    name: String!
                    message: CmsStringInput
                    settings: JSON
                }

                type CmsFieldValidation {
                    name: String!
                    message: CmsString
                    settings: JSON
                }

                type CmsFieldOptions {
                    label: CmsString
                    value: String
                }

                input CmsFieldOptionsInput {
                    label: CmsStringInput
                    value: String
                }


                type CmsContentModelField {
                    _id: String
                    label: CmsString
                    helpText: CmsString
                    placeholderText: CmsString
                    fieldId: String
                    type: String
                    unique: Boolean
                    searchable: Boolean
                    sortable: Boolean
                    options: [CmsFieldOptions]
                    validation: [CmsFieldValidation]
                    settings: JSON
                }

                input CmsContentModelFieldInput {
                    _id: String
                    label: CmsStringInput
                    helpText: CmsStringInput
                    placeholderText: CmsStringInput
                    fieldId: String
                    type: String
                    unique: Boolean
                    searchable: Boolean
                    sortable: Boolean
                    options: [CmsFieldOptionsInput]
                    validation: [CmsFieldValidationInput]
                    settings: JSON
                }

                type CmsContentModelListResponse {
                    data: [CmsContentModel]
                    meta: CmsListMeta
                    error: CmsError
                }

                type CmsContentModelResponse {
                    data: CmsContentModel
                    error: CmsError
                }

                extend type Query {
                    getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse
                    getPublishedContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse

                    listContentModels(
                        where: JSON
                        sort: JSON
                        limit: Int
                        after: String
                        before: String
                    ): CmsContentModelListResponse
                }

                extend type Mutation {
                    ${getMutations(type)}
                }
            `,
            resolvers: merge(
                {
                    Query: getQueryResolvers(),
                    Mutation: getMutationResolvers(type)
                },
                contentModelGroup.getResolvers(type),
                meta.resolvers
            )
        },
        security: merge({}, contentModelGroup.getResolvers(type))
    } as GraphQLSchemaPlugin<CmsContext>
];

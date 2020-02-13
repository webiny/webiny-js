import { GraphQLContextPlugin, GraphQLSchemaPlugin } from "@webiny/api/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate,
    emptyResolver
} from "@webiny/commodo-graphql";

import { i18nFieldType } from "./graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./graphqlTypes/i18nFieldInput";

import gql from "graphql-tag";
import { hasScope } from "@webiny/api-security";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { TypeValueEmitter } from "./utils/TypeValueEmitter";

const contentModelFetcher = ctx => ctx.models.CmsContentModel;

export default () => [
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

                extend type SecurityUser @key(fields: "id") {
                    id: ID @external
                }

                type CmsError {
                    code: String
                    message: String
                    data: JSON
                }

                type CmsListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                type CmsContentModel {
                    id: ID
                    title: String
                    modelId: String
                    description: String
                    createdOn: DateTime
                    createdBy: SecurityUser
                    fields: [CmsContentModelField]
                }

                input CmsContentModelInput {
                    title: String
                    modelId: String
                    description: String
                    fields: [CmsContentModelFieldInput]
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

                type CmsContentModelField {
                    _id: String
                    label: CmsString
                    fieldId: String
                    type: String
                    localization: Boolean
                    validation: [CmsFieldValidation]
                    settings: JSON
                }

                input CmsContentModelFieldInput {
                    _id: String
                    label: CmsStringInput
                    fieldId: String
                    type: String
                    localization: Boolean
                    unique: Boolean
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
                    cmsRead: CmsReadQuery
                    cmsManage: CmsManageQuery
                }

                extend type Mutation {
                    cmsManage: CmsManageMutation
                }

                type CmsReadQuery {
                    _empty: String
                }

                type CmsManageQuery {
                    getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse

                    listContentModels(
                        page: Int
                        perPage: Int
                        where: JSON
                        sort: JSON
                    ): CmsContentModelListResponse
                }

                type CmsManageMutation {
                    createContentModel(data: CmsContentModelInput!): CmsContentModelResponse

                    updateContentModel(
                        id: ID!
                        data: CmsContentModelInput!
                    ): CmsContentModelResponse

                    deleteContentModel(id: ID!): CmsDeleteResponse
                }
            `,
            resolvers: {
                Query: {
                    cmsManage: {
                        resolve: (parent, args, context) => {
                            context.cms.manage = true;
                            return {};
                        }
                    },
                    cmsRead: {
                        resolve: (parent, args, context) => {
                            /**
                             * Create emitter for resolved values.
                             * It is used in model field plugins to access values from sibling resolvers.
                             */
                            context.resolvedValues = new TypeValueEmitter();
                            return {};
                        }
                    }
                },
                Mutation: {
                    cmsManage: emptyResolver
                },
                CmsManageQuery: {
                    getContentModel: resolveGet(contentModelFetcher),
                    listContentModels: resolveList(contentModelFetcher)
                },
                CmsManageMutation: {
                    createContentModel: resolveCreate(contentModelFetcher),
                    updateContentModel: resolveUpdate(contentModelFetcher),
                    deleteContentModel: resolveDelete(contentModelFetcher)
                }
            }
        },
        security: {
            shield: {
                CmsManageQuery: {
                    getContentModel: hasScope("cms:contentModel:crud"),
                    listContentModels: hasScope("cms:contentModel:crud")
                }
            }
        }
    } as GraphQLSchemaPlugin,
    {
        name: "graphql-context-cms-context",
        type: "graphql-context",
        apply(context) {
            context.cms = context.cms || {};
        }
    } as GraphQLContextPlugin
];

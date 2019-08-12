// @flow
import { type PluginType } from "webiny-api/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate,
    dummyResolver
} from "webiny-api/graphql";
import { gql } from "apollo-server-lambda";
import { hasScope } from "webiny-api-security";
import { get } from "lodash";
import setupDynamicSchema from "./dynamicSchema";

const contentModelFetcher = ctx => {
    return ctx.getEntity("CmsContentModel");
};

export default ([
    {
        name: "graphql-context-locale",
        type: "graphql-context",
        apply(context) {
            const defaultLocale = "en-US";
            context.locale =
                get(context, "event.headers.Accept-Language") ||
                get(context, "event.headers.accept-language") ||
                defaultLocale;

            context.locale = context.locale.split(",")[0];
            context.defaultLocale = defaultLocale;
        }
    },
    {
        type: "graphql-schema",
        name: "graphql-schema-headless",
        prepare: async config => {
            await setupDynamicSchema(config);
        },
        schema: {
            typeDefs: gql`
                extend type User @key(fields: "id") {
                    id: ID @external
                }

                type ContentModel {
                    id: ID
                    title: String
                    modelId: String
                    description: String
                    createdOn: DateTime
                    createdBy: User @external
                    fields: [ContentModelField]
                }

                input ContentModelInput {
                    title: String
                    modelId: String
                    description: String
                    fields: [ContentModelFieldInput]
                }

                type ContentModelField {
                    id: String
                    label: String
                    fieldId: String
                    type: String
                    validation: [JSON]
                    settings: JSON
                }

                input ContentModelFieldInput {
                    id: String
                    label: String
                    fieldId: String
                    type: String
                    validation: [JSON]
                    settings: JSON
                }

                type ContentModelListResponse {
                    data: [ContentModel]
                    meta: ListMeta
                    error: Error
                }

                type ContentModelResponse {
                    data: ContentModel
                    error: Error
                }

                extend type CmsQuery {
                    headlessRead: HeadlessReadQuery
                    headlessManage: HeadlessManageQuery
                }

                extend type CmsMutation {
                    headlessManage: HeadlessManageMutation
                }

                type HeadlessReadQuery {
                    _empty: String
                }

                type HeadlessManageQuery {
                    getContentModel(id: ID, where: JSON, sort: String): ContentModelResponse

                    listContentModels(
                        page: Int
                        perPage: Int
                        where: JSON
                        sort: JSON
                    ): ContentModelListResponse
                }

                type HeadlessManageMutation {
                    createContentModel(data: ContentModelInput!): ContentModelResponse

                    updateContentModel(id: ID!, data: ContentModelInput!): ContentModelResponse

                    deleteContentModel(id: ID!): DeleteResponse
                }
            `,
            resolvers: {
                CmsQuery: {
                    headlessRead: {
                        fragment: "... on CmsQuery { cms }",
                        resolve: dummyResolver
                    },
                    headlessManage: {
                        fragment: "... on CmsQuery { cms }",
                        resolve: dummyResolver
                    }
                },
                CmsMutation: {
                    headlessManage: {
                        fragment: "... on CmsMutation { cms }",
                        resolve: dummyResolver
                    }
                },
                HeadlessReadQuery: {
                    _empty: () => ""
                },
                HeadlessManageQuery: {
                    getContentModel: resolveGet(contentModelFetcher),
                    listContentModels: resolveList(contentModelFetcher)
                },
                HeadlessManageMutation: {
                    createContentModel: resolveCreate(contentModelFetcher),
                    updateContentModel: resolveUpdate(contentModelFetcher),
                    deleteContentModel: resolveDelete(contentModelFetcher)
                }
            }
        },
        security: {
            shield: {
                HeadlessManageQuery: {
                    getContentModel: hasScope("cms:contentModel:crud"),
                    listContentModels: hasScope("cms:contentModel:crud")
                }
            }
        }
    }
]: Array<PluginType>);

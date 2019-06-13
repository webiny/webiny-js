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
import { hasScope } from "webiny-api-security";
import typeDefs from "webiny-api-headless/typeDefs";
import setupDynamicSchema from "./dynamicSchema";

const contentModelFetcher = ctx => {
    return ctx.cms.entities.ContentModel;
};

export default ([
    {
        type: "graphql-schema",
        name: "graphql-schema-headless",
        prepare: async config => {
            await setupDynamicSchema(config);
        },
        schema: {
            stitching: {
                linkTypeDefs: /* GraphQL */ `
                    ${typeDefs}

                    extend type CmsQuery {
                        headlessManage: HeadlessManageQuery
                    }

                    extend type CmsMutation {
                        headlessManage: HeadlessManageMutation
                    }

                    type HeadlessManageQuery {
                        getContentModel(id: ID, where: JSON, sort: String): ContentModelResponse

                        listContentModels(
                            page: Int
                            perPage: Int
                            where: JSON
                            sort: JSON
                            search: SearchInput
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

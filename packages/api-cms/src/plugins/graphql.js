// @flow
import { type PluginType } from "@webiny/api/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate,
    emptyResolver
} from "@webiny/commodo-graphql";

import gql from "graphql-tag";
import { hasScope } from "@webiny/api-security";
import { get } from "lodash";
import setupDynamicSchema from "./dynamicSchema";

const contentModelFetcher = ctx => ctx.models.CmsContent;

function renderTypes(plugins, type) {
    return Object.values(plugins)
        .map(pl => {
            // Render gql types generated by field type plugins
            if (typeof pl[type].createTypes === "function") {
                return pl[type].createTypes();
            }
            return "";
        })
        .join("\n");
}

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
        name: "graphql-schema-cms",
        prepare: async ({ plugins, config }) => {
            await setupDynamicSchema({ plugins, config });
        },
        schema: async ({ plugins }) => {
            const fieldTypePlugins = plugins.byType("cms-field-type").reduce((acc, pl) => {
                acc[pl.fieldType] = pl;
                return acc;
            }, {});

            const mFieldTypes = renderTypes(fieldTypePlugins, "manage");
            const rFieldTypes = renderTypes(fieldTypePlugins, "read");

            return {
                typeDefs: gql`
                    ${mFieldTypes}
                    ${rFieldTypes}

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

                    type ContentModel {
                        id: ID
                        title: String
                        modelId: String
                        description: String
                        createdOn: DateTime
                        createdBy: SecurityUser
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
                        meta: CmsListMeta
                        error: CmsError
                    }

                    type ContentModelResponse {
                        data: ContentModel
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
                        getContentModel(id: ID, where: JSON, sort: String): ContentModelResponse

                        listContentModels(
                            page: Int
                            perPage: Int
                            where: JSON
                            sort: JSON
                        ): ContentModelListResponse
                    }

                    type CmsManageMutation {
                        createContentModel(data: ContentModelInput!): ContentModelResponse

                        updateContentModel(id: ID!, data: ContentModelInput!): ContentModelResponse

                        deleteContentModel(id: ID!): CmsDeleteResponse
                    }
                `,
                resolvers: {
                    Query: {
                        cmsRead: emptyResolver,
                        cmsManage: emptyResolver
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
            };
        },
        security: {
            shield: {
                CmsManageQuery: {
                    getContentModel: hasScope("cms:contentModel:crud"),
                    listContentModels: hasScope("cms:contentModel:crud")
                }
            }
        }
    }
]: Array<PluginType>);

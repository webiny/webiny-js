// @flow
import { type PluginType } from "webiny-api/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import { hasScope } from "webiny-api-security";

import {
    ContentModel,
    ContentModelField,
    ContentModelInput,
    ContentModelResponse,
    ContentModelListResponse
} from "webiny-api-content-modelling/graphql";

const contentModelFetcher = ctx => {
    return ctx.cms.entities.ContentModel;
};

export default ([
    {
        type: "cms-schema",
        name: "cms-schema-content-modelling",
        typeDefs: /* GraphQL */ `
            ${ContentModel}
            ${ContentModelField}
            ${ContentModelInput}
            ${ContentModelResponse}
            ${ContentModelListResponse}

            extend type CmsQuery {
                getContentModel(id: ID, where: JSON, sort: String): ContentModelResponse

                listContentModels(
                    page: Int
                    perPage: Int
                    where: JSON
                    sort: JSON
                    search: SearchInput
                ): ContentModelListResponse
            }

            extend type CmsMutation {
                createContentModel(data: ContentModelInput!): ContentModelResponse

                updateContentModel(id: ID!, data: ContentModelInput!): ContentModelResponse

                deleteContentModel(id: ID!): DeleteResponse
            }
        `,
        resolvers: {
            CmsQuery: {
                getContentModel: resolveGet(contentModelFetcher),
                listContentModels: resolveList(contentModelFetcher)
            },
            CmsMutation: {
                createContentModel: resolveCreate(contentModelFetcher),
                updateContentModel: resolveUpdate(contentModelFetcher),
                deleteContentModel: resolveDelete(contentModelFetcher)
            }
        },
        security: {
            shield: {
                CmsQuery: {
                    getContentModel: hasScope("cms:contentModel:crud"),
                    listContentModels: hasScope("cms:contentModel:crud")
                }
            }
        }
    }
]: Array<PluginType>);

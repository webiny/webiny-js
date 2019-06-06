// @flow
import { type PluginType } from "webiny-api/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

import {
    ContentModelType,
    ContentModelInputType,
    ContentModelResponseType,
    ContentModelListResponseType
} from "webiny-api-content-modelling/graphql";

const contentModelFetcher = ctx => ctx.headless.entities.ContentModel;

export default ([
    {
        type: "graphql",
        name: "graphql-content-modelling-schema",
        namespace: "contentModelling",
        stitching: {
            linkTypeDefs: /* GraphQL */ `
                ${ContentModelType}
                ${ContentModelInputType}
                ${ContentModelResponseType}
                ${ContentModelListResponseType}

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
            }
        }
    }
]: Array<PluginType>);

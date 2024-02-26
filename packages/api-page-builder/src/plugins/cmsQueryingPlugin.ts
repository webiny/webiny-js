import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { getSchema } from "@webiny/api-headless-cms/graphql/getSchema";
import { ApiEndpoint, CmsContext } from "@webiny/api-headless-cms/types";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql";
import { buildDynamicPageDataQuery } from "~/utils/buildDynamicPageDataQuery";

export type Filter = {
    filters: {
        path: string;
        condition: string;
        value: string;
    }[];
    filterCondition: string;
};

export type Sort = {
    path: string;
    direction: string;
};
declare module "@webiny/api-headless-cms/types" {
    interface HeadlessCms {
        // TODO: @pavel expose this method on the `context.cms` by default
        getExecutableSchema: (
            type: ApiEndpoint
        ) => Promise<
            (
                input: GraphQLRequestBody | GraphQLRequestBody[]
            ) => ReturnType<typeof processRequestBody>
        >;
    }
}

export const createInternalCmsQuerying = () => {
    return [
        // First we need to expose a utility to access the executable CMS schema.
        new ContextPlugin<CmsContext>(context => {
            const getTenant = () => {
                return context.tenancy.getCurrentTenant();
            };

            const getLocale = () => {
                const locale = context.i18n.getContentLocale();
                if (!locale) {
                    throw new WebinyError(
                        "Missing locale on context.i18n locale in File Manager API.",
                        "LOCALE_ERROR"
                    );
                }
                return locale;
            };

            context.cms.getExecutableSchema = async (type: ApiEndpoint) => {
                const originalType = context.cms.type;
                context.cms.type = type;
                const schema = await context.security.withoutAuthorization(() => {
                    return getSchema({
                        context,
                        getTenant,
                        getLocale,
                        type
                    });
                });

                context.cms.type = originalType;

                return async (input: GraphQLRequestBody | GraphQLRequestBody[]) => {
                    return await context.security.withoutAuthorization(() =>
                        processRequestBody(input, schema, context)
                    );
                };
            };
        }),
        // Now we expose a new GraphQL query, which allows us to execute an arbitrary query, sent as an input.
        new GraphQLSchemaPlugin<CmsContext>({
            typeDefs: /* GraphQL */ `
                type GetDynamicPageDataResponse {
                    data: JSON
                    error: CmsError
                }

                input GetDynamicPageDataFilterItemInput {
                    path: String!
                    condition: String!
                    value: String!
                }

                input GetDynamicPageDataFilterInput {
                    filters: [GetDynamicPageDataFilterItemInput!]!
                    filterCondition: String
                }

                input GetDynamicPageDataSortInput {
                    path: String!
                    direction: String!
                }

                input GetDynamicPageDataWhereInput {
                    entryId: String
                }

                extend type Query {
                    getDynamicPageData(
                        modelId: String!
                        paths: [String!]
                        filter: GetDynamicPageDataFilterInput
                        sort: [GetDynamicPageDataSortInput!]
                        limit: Number
                        where: GetDynamicPageDataWhereInput
                        isPreviewEndpoint: Boolean
                    ): GetDynamicPageDataResponse
                }
            `,
            resolvers: {
                Query: {
                    async getDynamicPageData(_, args, context) {
                        const { modelId, paths, filter, sort, limit, where, isPreviewEndpoint } =
                            args as {
                                modelId: string;
                                paths: string[];
                                filter?: Filter;
                                sort?: Sort[];
                                limit?: number;
                                where?: {
                                    entryId?: string;
                                };
                                isPreviewEndpoint?: boolean;
                            };

                        try {
                            const model = await context.security.withoutAuthorization(async () => {
                                return await context.cms.getModel(modelId);
                            });

                            if (!model) {
                                return new NotFoundResponse("Model not found.");
                            }

                            const query = await context.security.withoutAuthorization(async () => {
                                return await buildDynamicPageDataQuery({
                                    context,
                                    model,
                                    paths,
                                    filter,
                                    sort,
                                    limit,
                                    additionalWhere: where
                                });
                            });

                            // Get a schema for a desired CMS endpoint: `read`, `manage`, or `preview`.
                            const querySchema = await context.cms.getExecutableSchema(
                                isPreviewEndpoint ? "preview" : "read"
                            );
                            const data = await querySchema({
                                // Since the operation name must match the one below, let's wrap the query into a named operation.
                                query: `query RunQuery ${query}`,
                                // Variables can be passed programmatically, from GraphQL, or from block settings.
                                variables: {},
                                // GraphQL expects an operation name, so let's have a dummy name like this.
                                operationName: "RunQuery"
                            });

                            return new Response(data);
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                }
            }
        })
    ];
};

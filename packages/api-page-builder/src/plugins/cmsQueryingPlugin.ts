import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import { getSchema } from "@webiny/api-headless-cms/graphql/getSchema";
import { ApiEndpoint, CmsContext } from "@webiny/api-headless-cms/types";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";

declare module "@webiny/api-headless-cms/types" {
    interface HeadlessCms {
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
            const getLastModifiedTime = () => {
                return context.cms.getModelLastChange();
            };

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
                        getLastModifiedTime,
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
            typeDefs: /* GraphQL*/ `
                type RunQueryResponse {
                    data: JSON
                    error: CmsError
                }

                extend type Query {
                    runQuery(query: String!): RunQueryResponse
                }
            `,
            resolvers: {
                Query: {
                    async runQuery(_, args, context) {
                        const { query } = args as { query: string };

                        try {
                            // Get a schema for a desired CMS endpoint: `read`, `manage`, or `preview`.
                            const querySchema = await context.cms.getExecutableSchema("read");
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
                            return new ErrorResponse({
                                code: "FAILED_TO_EXECUTE_CMS_QUERY",
                                message: err.message
                            });
                        }
                    }
                }
            }
        })
    ];
};

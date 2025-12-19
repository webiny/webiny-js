import { ErrorResponse, GraphQLSchemaPlugin, ListResponse } from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import type { WebsiteBuilderContext } from "~/context/types.js";
import { redirectsTypeDefs } from "~/graphql/redirects/redirects.typeDefs.js";

export const createRedirectsSchema = () => {
    const pageGraphQL = new GraphQLSchemaPlugin<WebsiteBuilderContext>({
        typeDefs: redirectsTypeDefs,
        resolvers: {
            WbQuery: {
                listRedirects: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const [entries, meta] = await context.websiteBuilder.redirects.list(args);
                        return new ListResponse(entries, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            WbMutation: {
                createRedirect: async (_, { data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.redirects.create(data);
                    });
                },
                updateRedirect: async (_, { id, data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.redirects.update(id, data);
                    });
                },
                moveRedirect: async (_, { id, folderId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        await context.websiteBuilder.redirects.move({ id, folderId });
                        return true;
                    });
                },
                deleteRedirect: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        await context.websiteBuilder.redirects.delete({ id });
                        return true;
                    });
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.redirects";

    return pageGraphQL;
};

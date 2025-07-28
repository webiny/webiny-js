import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    Response
} from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication";
import { resolve } from "~/utils/resolve";
import { WebsiteBuilderContext } from "~/context/types";
import { redirectsTypeDefs } from "~/graphql/redirects/redirects.typeDefs";

export const createRedirectsSchema = () => {
    const pageGraphQL = new GraphQLSchemaPlugin<WebsiteBuilderContext>({
        typeDefs: redirectsTypeDefs,
        resolvers: {
            WbQuery: {
                getRedirectById: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.redirects.getById(id);
                    });
                },
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
                    ensureAuthentication(context);
                    await context.websiteBuilder.redirects.move({ id, folderId });
                    return new Response(true);
                },
                deleteRedirect: async (_, { id }, context) => {
                    ensureAuthentication(context);
                    await context.websiteBuilder.redirects.delete({ id });
                    return new Response(true);
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.redirects";

    return pageGraphQL;
};

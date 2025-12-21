import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ErrorResponse, GraphQLSchemaPlugin, ListResponse } from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { redirectsTypeDefs } from "~/graphql/redirects/redirects.typeDefs.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";

export const createRedirectsSchema = () => {
    const pageGraphQL = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: redirectsTypeDefs,
        resolvers: {
            WbQuery: {
                listRedirects: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const listRedirects = context.container.resolve(ListRedirectsUseCase);
                        const result = await listRedirects.execute(args);

                        if (result.isFail()) {
                            throw result.error;
                        }

                        const { redirects, meta } = result.value;
                        return new ListResponse(redirects, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            WbMutation: {
                createRedirect: async (_, { data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const createRedirect = context.container.resolve(CreateRedirectUseCase);
                        const result = await createRedirect.execute(data);

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                updateRedirect: async (_, { id, data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const updateRedirect = context.container.resolve(UpdateRedirectUseCase);
                        const result = await updateRedirect.execute(id, data);

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                moveRedirect: async (_, { id, folderId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const moveRedirect = context.container.resolve(MoveRedirectUseCase);
                        const result = await moveRedirect.execute({ id, folderId });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return true;
                    });
                },
                deleteRedirect: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const deleteRedirect = context.container.resolve(DeleteRedirectUseCase);
                        const result = await deleteRedirect.execute({ id });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return true;
                    });
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.redirects";

    return pageGraphQL;
};

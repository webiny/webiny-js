import { ErrorResponse, ListResponse } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { redirectsTypeDefs } from "~/graphql/redirects/redirects.typeDefs.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { MoveRedirectUseCase } from "~/features/redirects/MoveRedirect/index.js";

export const addRedirectsSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(redirectsTypeDefs);

    builder.addResolver({
        path: "WbQuery.listRedirects",
        dependencies: [ListRedirectsUseCase],
        resolver(listRedirects) {
            return async ({ args, context }) => {
                try {
                    ensureAuthentication(context);
                    const result = await listRedirects.execute(args);

                    if (result.isFail()) {
                        throw result.error;
                    }

                    const { redirects, meta } = result.value;
                    return new ListResponse(redirects, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            };
        }
    });

    builder.addResolver({
        path: "WbMutation.createRedirect",
        dependencies: [CreateRedirectUseCase],
        resolver(createRedirect) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await createRedirect.execute(args.data);

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updateRedirect",
        dependencies: [UpdateRedirectUseCase],
        resolver(updateRedirect) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await updateRedirect.execute(args.id, args.data);

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.moveRedirect",
        dependencies: [MoveRedirectUseCase],
        resolver(moveRedirect) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await moveRedirect.execute({
                        id: args.id,
                        folderId: args.folderId
                    });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.deleteRedirect",
        dependencies: [DeleteRedirectUseCase],
        resolver(deleteRedirect) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await deleteRedirect.execute({ id: args.id });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return true;
                });
        }
    });
};

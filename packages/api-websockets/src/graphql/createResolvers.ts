import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { Context } from "~/types.js";
import { emptyResolver } from "./utils.js";
import { resolve } from "./utils.js";
import type { IWebsocketsListConnectionsParams } from "~/features/ListConnections/abstractions.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import { checkPermissions } from "~/graphql/checkPermissions.js";

export interface IWebsocketsMutationDisconnectConnectionsArgs {
    connections: string[];
}

export interface IWebsocketsMutationDisconnectIdentityArgs {
    identityId: string;
}

export interface IWebsocketsMutationDisconnectTenantArgs {
    tenant: string;
}

export const createResolvers = (): Resolvers<Context> => {
    return {
        Query: {
            websockets: emptyResolver
        },
        Mutation: {
            websockets: emptyResolver
        },
        WebsocketsQuery: {
            listConnections: async (_, args: IWebsocketsListConnectionsParams, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    const listConnections = context.container.resolve(
                        WebsocketsListConnectionsUseCase
                    );
                    const result = await listConnections.execute(args);

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            }
        },
        WebsocketsMutation: {
            disconnect: async (_, args: IWebsocketsMutationDisconnectConnectionsArgs, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            connections: args.connections
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectIdentity: async (
                _,
                args: IWebsocketsMutationDisconnectIdentityArgs,
                context
            ) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            identityId: args.identityId
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectTenant: async (_, args: IWebsocketsMutationDisconnectTenantArgs, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute({
                        where: {
                            tenant: args.tenant
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            },
            disconnectAll: async (_, __, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const disconnect = context.container.resolve(WebsocketsDisconnectUseCase);
                    const result = await disconnect.execute();

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
            }
        }
    };
};

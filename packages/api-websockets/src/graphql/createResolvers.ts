import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { Context } from "~/types.js";
import { emptyResolver, resolve } from "./utils.js";
import type { IWebsocketsContextListConnectionsParams } from "~/context/index.js";
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
            listConnections: async (_, args: IWebsocketsContextListConnectionsParams, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    return await context.websockets.listConnections(args);
                });
            }
        },
        WebsocketsMutation: {
            disconnect: async (_, args: IWebsocketsMutationDisconnectConnectionsArgs, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    return await context.websockets.disconnect({
                        where: {
                            connections: args.connections
                        }
                    });
                });
            },
            disconnectIdentity: async (
                _,
                args: IWebsocketsMutationDisconnectIdentityArgs,
                context
            ) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    return await context.websockets.disconnect({
                        where: {
                            identityId: args.identityId
                        }
                    });
                });
            },
            disconnectTenant: async (_, args: IWebsocketsMutationDisconnectTenantArgs, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    return await context.websockets.disconnect({
                        where: {
                            tenant: args.tenant
                        }
                    });
                });
            },
            disconnectAll: async (_, __, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    return await context.websockets.disconnect();
                });
            }
        }
    };
};

import { Resolvers } from "@webiny/handler-graphql/types";
import { Context } from "~/types";
import { emptyResolver, resolve } from "./utils";
import { IWebsocketsContextListConnectionsParams } from "~/context";
import { IWebsocketsConnectionRegistryData } from "~/registry";
import { checkPermissions } from "~/graphql/checkPermissions";

export interface IWebsocketsMutationDisconnectConnectionsArgs {
    connections: string[];
}

export interface IWebsocketsMutationDisconnectIdentityArgs {
    identityId: string;
}

export interface IWebsocketsMutationDisconnectTenantArgs {
    tenant: string;
    locale?: string;
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
                            tenant: args.tenant,
                            locale: args.locale
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

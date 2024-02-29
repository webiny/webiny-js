import { Resolvers } from "@webiny/handler-graphql/types";
import { Context } from "~/types";
import { emptyResolver, resolve } from "./utils";
import { IWebsocketsContextListConnectionsParams } from "~/context";

export interface IWebsocketsMutationDisconnectConnectionArgs {
    connectionId: string;
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
                    return await context.websockets.listConnections(args);
                });
            }
        },
        WebsocketsMutation: {
            // @ts-expect-error
            disconnectConnection: async (
                _,
                args: IWebsocketsMutationDisconnectConnectionArgs,
                context
            ) => {
                return resolve(async () => {
                    return await context.websockets.disconnect({
                        where: {
                            connectionId: args.connectionId
                        }
                    });
                });
            },
            // @ts-expect-error
            disconnectIdentity: async (
                _,
                args: IWebsocketsMutationDisconnectIdentityArgs,
                context
            ) => {
                return resolve(async () => {
                    return await context.websockets.disconnect({
                        where: {
                            identityId: args.identityId
                        }
                    });
                });
            },
            // @ts-expect-error
            disconnectTenant: async (_, args: IWebsocketsMutationDisconnectTenantArgs, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect({
                        where: {
                            tenant: args.tenant,
                            locale: args.locale
                        }
                    });
                });
            },
            disconnectAll: async (_, __, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect();
                });
            }
        }
    };
};

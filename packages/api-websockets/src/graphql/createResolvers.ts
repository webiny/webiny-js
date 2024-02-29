import { Resolvers } from "@webiny/handler-graphql/types";
import { Context } from "~/types";
import { emptyResolver, resolve } from "./utils";

export interface WebsocketsQueryListConnectionsArgs {
    where?: {
        identityId?: string;
        tenant?: string;
        locale?: string;
    };
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
            listConnections: async (_, args: WebsocketsQueryListConnectionsArgs, context) => {
                return resolve(async () => {
                    return await context.websockets.listConnections(args);
                });
            }
        },
        WebsocketsMutation: {
            disconnectConnection: async (_, args, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect(args);
                });
            },
            disconnectIdentity: async (_, args, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect(args);
                });
            },
            disconnectTenant: async (_, args, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect(args);
                });
            },
            disconnectAll: async (_, args, context) => {
                return resolve(async () => {
                    return await context.websockets.disconnect();
                });
            }
        }
    };
};

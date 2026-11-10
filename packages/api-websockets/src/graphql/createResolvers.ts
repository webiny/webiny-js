import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { Context } from "~/types.js";
import { emptyResolver, resolve } from "./utils.js";
import type {
    IWebsocketsContextListConnectionsParams,
    IWebsocketsContextListConnectionsParamsWhere
} from "~/context/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
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

/**
 * Only a full-access identity in the root tenant may see and disconnect connections of all
 * tenants. Everyone else is limited to the current tenant's connections.
 */
const canAccessAllTenants = async (context: Context): Promise<boolean> => {
    const tenant = context.container.resolve(TenantContext).getTenant();
    if (tenant.id !== "root") {
        return false;
    }
    return context.container.resolve(IdentityContext).hasFullAccess();
};

const listScopedConnections = async (
    context: Context,
    where: IWebsocketsContextListConnectionsParamsWhere | undefined
): Promise<IWebsocketsConnectionRegistryData[]> => {
    const result = await context.websockets.listConnections({ where });
    if (result.isFail()) {
        throw result.error;
    }
    if (await canAccessAllTenants(context)) {
        return result.value;
    }
    const tenantId = context.container.resolve(TenantContext).getTenant().id;
    return result.value.filter(connection => connection.tenant === tenantId);
};

const disconnectScopedConnections = async (
    context: Context,
    where: IWebsocketsContextListConnectionsParamsWhere | undefined
): Promise<IWebsocketsConnectionRegistryData[]> => {
    const connections = await listScopedConnections(context, where);
    if (connections.length === 0) {
        return [];
    }
    const result = await context.websockets.disconnect({
        where: { connections: connections.map(connection => connection.connectionId) }
    });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

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
                    return listScopedConnections(context, args.where);
                });
            }
        },
        WebsocketsMutation: {
            disconnect: async (_, args: IWebsocketsMutationDisconnectConnectionsArgs, context) => {
                return resolve(async () => {
                    await checkPermissions(context);
                    return disconnectScopedConnections(context, { connections: args.connections });
                });
            },
            disconnectIdentity: async (
                _,
                args: IWebsocketsMutationDisconnectIdentityArgs,
                context
            ) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    return disconnectScopedConnections(context, { identityId: args.identityId });
                });
            },
            disconnectTenant: async (_, args: IWebsocketsMutationDisconnectTenantArgs, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    const currentTenant = context.container.resolve(TenantContext).getTenant();
                    if (args.tenant !== currentTenant.id && !(await canAccessAllTenants(context))) {
                        throw new NotAuthorizedError();
                    }
                    return disconnectScopedConnections(context, { tenant: args.tenant });
                });
            },
            disconnectAll: async (_, __, context) => {
                return resolve<IWebsocketsConnectionRegistryData[]>(async () => {
                    await checkPermissions(context);
                    return disconnectScopedConnections(context, undefined);
                });
            }
        }
    };
};

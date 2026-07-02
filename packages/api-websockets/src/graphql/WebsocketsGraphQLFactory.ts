import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { WebsocketsDisconnectUseCase } from "~/features/Disconnect/abstractions.js";
import type { WebsocketsPermission } from "~/types.js";

interface IDisconnectConnectionsArgs {
    connections: string[];
}

interface IDisconnectIdentityArgs {
    identityId: string;
}

interface IDisconnectTenantArgs {
    tenant: string;
}

const checkPermissions = async (identityContext: IdentityContext.Interface): Promise<void> => {
    const permissions = await identityContext.getPermissions<WebsocketsPermission>("websockets");

    if (permissions.length === 0) {
        throw new NotAuthorizedError();
    }
};

class WebsocketsGraphQL implements CoreGraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(`
            type WebsocketsIdentity {
                id: String!
                type: String
                displayName: String
            }

            type WebsocketsConnection {
                connectionId: String!
                endpoint: String!
                identity: WebsocketsIdentity!
                connectedOn: DateTime!
                tenant: String!
            }

            type WebsocketsError {
                message: String!
                code: String!
                data: JSON
            }

            type WebsocketsListConnectionsResponse {
                data: [WebsocketsConnection!]
                error: WebsocketsError
            }

            input WebsocketsListConnectionsWhereInput {
                identityId: String
                tenant: String
            }

            type WebsocketsDisconnectResponse {
                data: [WebsocketsConnection!]
                error: WebsocketsError
            }

            type WebsocketsQuery {
                _empty: String
            }

            type WebsocketsMutation {
                _empty: String
            }

            extend type Query {
                websockets: WebsocketsQuery
            }

            extend type Mutation {
                websockets: WebsocketsMutation
            }

            extend type WebsocketsQuery {
                listConnections(
                    where: WebsocketsListConnectionsWhereInput
                ): WebsocketsListConnectionsResponse!
            }

            extend type WebsocketsMutation {
                disconnect(connections: [String!]!): WebsocketsDisconnectResponse!
                disconnectIdentity(identityId: String!): WebsocketsDisconnectResponse!
                disconnectTenant(tenant: String!): WebsocketsDisconnectResponse!
                disconnectAll: WebsocketsDisconnectResponse!
            }
        `);

        builder.addResolver({
            path: "Query.websockets",
            resolver: () => {
                return async () => {
                    return {};
                };
            }
        });

        builder.addResolver({
            path: "Mutation.websockets",
            resolver: () => {
                return async () => {
                    return {};
                };
            }
        });

        builder.addResolver<WebsocketsListConnectionsUseCase.Params>({
            path: "WebsocketsQuery.listConnections",
            dependencies: [IdentityContext, WebsocketsListConnectionsUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                listConnections: WebsocketsListConnectionsUseCase.Interface
            ) => {
                return async ({ args }: { args: WebsocketsListConnectionsUseCase.Params }) => {
                    try {
                        await checkPermissions(identityContext);

                        const result = await listConnections.execute(args);

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response(result.value);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                };
            }
        });

        builder.addResolver<IDisconnectConnectionsArgs>({
            path: "WebsocketsMutation.disconnect",
            dependencies: [IdentityContext, WebsocketsDisconnectUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                disconnect: WebsocketsDisconnectUseCase.Interface
            ) => {
                return async ({ args }: { args: IDisconnectConnectionsArgs }) => {
                    try {
                        await checkPermissions(identityContext);

                        const result = await disconnect.execute({
                            where: {
                                connections: args.connections
                            }
                        });

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response(result.value);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                };
            }
        });

        builder.addResolver<IDisconnectIdentityArgs>({
            path: "WebsocketsMutation.disconnectIdentity",
            dependencies: [IdentityContext, WebsocketsDisconnectUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                disconnect: WebsocketsDisconnectUseCase.Interface
            ) => {
                return async ({ args }: { args: IDisconnectIdentityArgs }) => {
                    try {
                        await checkPermissions(identityContext);

                        const result = await disconnect.execute({
                            where: {
                                identityId: args.identityId
                            }
                        });

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response(result.value);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                };
            }
        });

        builder.addResolver<IDisconnectTenantArgs>({
            path: "WebsocketsMutation.disconnectTenant",
            dependencies: [IdentityContext, WebsocketsDisconnectUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                disconnect: WebsocketsDisconnectUseCase.Interface
            ) => {
                return async ({ args }: { args: IDisconnectTenantArgs }) => {
                    try {
                        await checkPermissions(identityContext);

                        const result = await disconnect.execute({
                            where: {
                                tenant: args.tenant
                            }
                        });

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response(result.value);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                };
            }
        });

        builder.addResolver({
            path: "WebsocketsMutation.disconnectAll",
            dependencies: [IdentityContext, WebsocketsDisconnectUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                disconnect: WebsocketsDisconnectUseCase.Interface
            ) => {
                return async () => {
                    try {
                        await checkPermissions(identityContext);

                        const result = await disconnect.execute();

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return new Response(result.value);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                };
            }
        });

        return builder;
    }
}

export const WebsocketsGraphQLFactory = CoreGraphQLSchemaFactory.createImplementation({
    dependencies: [],
    implementation: WebsocketsGraphQL
});

import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Response } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { ListAdminExtensionsUseCase } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { SetAdminExtensionEnabledUseCase } from "~/api/adminExtensions/features/SetAdminExtensionEnabled/abstractions.js";
import { ListEnabledAdminExtensionsUseCase } from "~/api/adminExtensions/features/ListEnabledAdminExtensions/abstractions.js";
import { DeleteAdminExtensionUseCase } from "~/api/adminExtensions/features/DeleteAdminExtension/abstractions.js";
import { ADMIN_EXTENSION_KINDS } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

interface IListArgs {
    kind?: AdminExtensionKind | null;
    enabled?: boolean | null;
}

interface IListEnabledArgs {
    kind: AdminExtensionKind;
}

interface ISetEnabledArgs {
    id: string;
    enabled: boolean;
}

interface IIdArgs {
    id: string;
}

function toListInput(args: IListArgs): ListAdminExtensionsUseCase.Input {
    const input: ListAdminExtensionsUseCase.Input = {};

    if (args.kind) {
        input.kind = args.kind;
    }
    if (typeof args.enabled === "boolean") {
        input.enabled = args.enabled;
    }

    return input;
}

/*
 * Reads and manages stored admin extensions. There is no create mutation on purpose: extensions
 * are written by the tools that validate them, not by a raw write of source.
 */
class AdminExtensionSchemaImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("remote-components/AdminExtensionSchema");

    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        const kinds = ADMIN_EXTENSION_KINDS.join("\n");

        builder.addTypeDefs(/* GraphQL */ `
            enum AdminExtensionKind {
                ${kinds}
            }

            type AdminExtensionError {
                code: String
                message: String
                data: JSON
            }

            type AdminExtension {
                id: ID!
                kind: AdminExtensionKind!
                name: String!
                label: String!
                description: String
                enabled: Boolean!
                runtimeVersion: Int!
                source: String
                config: String
                compiled: String
                createdOn: DateTime
                savedOn: DateTime
            }

            type AdminExtensionResponse {
                data: AdminExtension
                error: AdminExtensionError
            }

            type AdminExtensionListResponse {
                data: [AdminExtension!]
                error: AdminExtensionError
            }

            type AdminExtensionBooleanResponse {
                data: Boolean
                error: AdminExtensionError
            }

            type AdminExtensionQuery {
                listAdminExtensions(
                    kind: AdminExtensionKind
                    enabled: Boolean
                ): AdminExtensionListResponse!
                listEnabledAdminExtensions(kind: AdminExtensionKind!): AdminExtensionListResponse!
            }

            type AdminExtensionMutation {
                setAdminExtensionEnabled(id: ID!, enabled: Boolean!): AdminExtensionResponse!
                deleteAdminExtension(id: ID!): AdminExtensionBooleanResponse!
            }

            extend type Query {
                adminExtensions: AdminExtensionQuery!
            }

            extend type Mutation {
                adminExtensions: AdminExtensionMutation!
            }
        `);

        builder.addResolver({
            path: "Query.adminExtensions",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.adminExtensions",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<IListArgs>({
            path: "AdminExtensionQuery.listAdminExtensions",
            dependencies: [ListAdminExtensionsUseCase],
            resolver: (useCase: ListAdminExtensionsUseCase.Interface) => {
                return async ({ args }) => {
                    const input = toListInput(args);
                    const result = await useCase.execute(input);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IListEnabledArgs>({
            path: "AdminExtensionQuery.listEnabledAdminExtensions",
            dependencies: [ListEnabledAdminExtensionsUseCase],
            resolver: (useCase: ListEnabledAdminExtensionsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.kind);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<ISetEnabledArgs>({
            path: "AdminExtensionMutation.setAdminExtensionEnabled",
            dependencies: [SetAdminExtensionEnabledUseCase],
            resolver: (useCase: SetAdminExtensionEnabledUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute({ id: args.id, enabled: args.enabled });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "AdminExtensionMutation.deleteAdminExtension",
            dependencies: [DeleteAdminExtensionUseCase],
            resolver: (useCase: DeleteAdminExtensionUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const AdminExtensionSchema = GraphQLSchemaFactory.createImplementation({
    implementation: AdminExtensionSchemaImpl,
    dependencies: []
});

import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { Team } from "~/types/security.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { GetTeamUseCase } from "~/features/security/teams/GetTeam/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { CreateTeam } from "~/features/security/teams/CreateTeam/index.js";
import { UpdateTeam } from "~/features/security/teams/UpdateTeam/index.js";
import { DeleteTeam } from "~/features/security/teams/DeleteTeam/index.js";

export const addTeamSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
        type SecurityTeam {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            roles: [SecurityRole]
            system: Boolean!
            plugin: Boolean
        }

        input SecurityTeamCreateInput {
            name: String!
            slug: String!
            description: String
            roles: [RefInput!]!
        }

        input SecurityTeamUpdateInput {
            name: String
            description: String
            roles: [RefInput!]
        }

        type SecurityTeamResponse {
            data: SecurityTeam
            error: SecurityError
        }

        type SecurityTeamListResponse {
            data: [SecurityTeam]
            error: SecurityError
        }

        input GetTeamWhereInput {
            id: ID
            slug: String
        }

        extend type SecurityQuery {
            getTeam(where: GetTeamWhereInput!): SecurityTeamResponse
            listTeams: SecurityTeamListResponse
        }

        extend type SecurityMutation {
            createTeam(data: SecurityTeamCreateInput!): SecurityTeamResponse
            updateTeam(id: ID!, data: SecurityTeamUpdateInput!): SecurityTeamResponse
            deleteTeam(id: ID!): SecurityBooleanResponse
        }
    `);

    builder.addResolver({
        path: "SecurityTeam.roles",
        dependencies: [ListRolesUseCase],
        resolver:
            (useCase: ListRolesUseCase.Interface) =>
            async ({ parent }: { parent: Team }) => {
                try {
                    const result = await useCase.execute({ where: { id_in: parent.roles } });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver<{ where: any }>({
        path: "SecurityQuery.getTeam",
        dependencies: [GetTeamUseCase],
        resolver:
            (useCase: GetTeamUseCase.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.where);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver({
        path: "SecurityQuery.listTeams",
        dependencies: [ListTeamsUseCase],
        resolver: (useCase: ListTeamsUseCase.Interface) => async () => {
            try {
                const result = await useCase.execute();
                if (result.isFail()) {
                    throw result.error;
                }
                return new ListResponse(result.value);
            } catch (e) {
                return new ListErrorResponse(e);
            }
        }
    });

    builder.addResolver<{ data: any }>({
        path: "SecurityMutation.createTeam",
        dependencies: [CreateTeam],
        resolver:
            (useCase: CreateTeam.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver<{ id: string; data: any }>({
        path: "SecurityMutation.updateTeam",
        dependencies: [UpdateTeam],
        resolver:
            (useCase: UpdateTeam.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.id, args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });

    builder.addResolver<{ id: string }>({
        path: "SecurityMutation.deleteTeam",
        dependencies: [DeleteTeam],
        resolver:
            (useCase: DeleteTeam.Interface) =>
            async ({ args }) => {
                try {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
    });
};

import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
import type { ApiCoreContext } from "~/types/core.js";
import type { Team } from "~/types/security.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { GetTeamUseCase } from "~/features/security/teams/GetTeam/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { CreateTeam } from "~/features/security/teams/CreateTeam/index.js";
import { UpdateTeam } from "~/features/security/teams/UpdateTeam/index.js";
import { DeleteTeam } from "~/features/security/teams/DeleteTeam/index.js";

const schema: GraphQLSchemaDefinition<ApiCoreContext> = {
    typeDefs: /* GraphQL */ `
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
    `,
    resolvers: {
        SecurityTeam: {
            roles: async (team: Team, __, context) => {
                try {
                    const useCase = context.container.resolve(ListRolesUseCase);
                    const result = await useCase.execute({ where: { id_in: team.roles } });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        SecurityQuery: {
            getTeam: async (_, { where }, context) => {
                try {
                    const useCase = context.container.resolve(GetTeamUseCase);
                    const result = await useCase.execute(where);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listTeams: async (_, __, context) => {
                try {
                    const useCase = context.container.resolve(ListTeamsUseCase);
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new ListResponse(result.value);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            createTeam: async (_, { data }, context) => {
                try {
                    const useCase = context.container.resolve(CreateTeam);
                    const result = await useCase.execute(data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateTeam: async (_, { id, data }, context) => {
                try {
                    const useCase = context.container.resolve(UpdateTeam);
                    const result = await useCase.execute(id, data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(result.value);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteTeam: async (_, { id }, context) => {
                try {
                    const useCase = context.container.resolve(DeleteTeam);
                    const result = await useCase.execute(id);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
};

export default schema;

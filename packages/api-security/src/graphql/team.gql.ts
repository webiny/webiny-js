import {
    ErrorResponse,
    ListErrorResponse,
    ListResponse,
    Response
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { SecurityContext, Team } from "~/types";

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type SecurityTeam {
            id: ID
            name: String
            slug: String
            createdOn: DateTime
            description: String
            groups: [SecurityGroup]
            system: Boolean!
            plugin: Boolean
        }

        input SecurityTeamCreateInput {
            name: String!
            slug: String!
            description: String
            groups: [RefInput!]!
        }

        input SecurityTeamUpdateInput {
            name: String
            description: String
            groups: [RefInput!]
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
            groups: async (team: Team, __, context) => {
                try {
                    return context.security.listGroups({ where: { id_in: team.groups } });
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        SecurityQuery: {
            getTeam: async (_, { where }, context) => {
                try {
                    const team = await context.security.getTeam({ where });
                    return new Response(team);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listTeams: async (_, __, context) => {
                try {
                    const teamList = await context.security.listTeams();

                    return new ListResponse(teamList);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        },
        SecurityMutation: {
            createTeam: async (_, { data }, context) => {
                try {
                    const team = await context.security.createTeam(data);

                    return new Response(team);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateTeam: async (_, { id, data }, context) => {
                try {
                    const team = await context.security.updateTeam(id, data);
                    return new Response(team);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteTeam: async (_, { id }, context) => {
                try {
                    await context.security.deleteTeam(id);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

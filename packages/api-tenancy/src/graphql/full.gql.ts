import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { TenancyContext } from "~/types";
import types from "./types.gql";

const emptyResolver = () => ({});

export default [
    types,
    new GraphQLSchemaPlugin<TenancyContext>({
        typeDefs: /* GraphQL */ `
            type TenancyQuery {
                version: String
            }

            type TenancyMutation {
                install: TenancyBooleanResponse
            }

            type TenantResponse {
                data: Tenant
                error: TenancyError
            }

            extend type Query {
                tenancy: TenancyQuery
            }

            extend type Mutation {
                tenancy: TenancyMutation
            }

            type TenancyBooleanResponse {
                data: Boolean
                error: TenancyError
            }

            type TenancyError {
                code: String
                message: String
                data: JSON
            }
        `,
        resolvers: {
            Query: {
                tenancy: emptyResolver
            },
            Mutation: {
                tenancy: emptyResolver
            },
            TenancyQuery: {
                version: async (_, __, context) => {
                    return await context.tenancy.getVersion();
                }
            },
            TenancyMutation: {
                install: async (_, __, context) => {
                    try {
                        await context.tenancy.install();
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    })
];

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { TenancyContext } from "~/types";

const emptyResolver = () => ({});

export default new GraphQLSchemaPlugin<TenancyContext>({
    typeDefs: /* GraphQL */ `
        type Tenant {
            id: ID!
            name: String!
            description: String!
            parent: ID
        }

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
        Tenant: {
            description(tenant) {
                return tenant.description || "";
            }
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
});

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { TenancyContext } from "~/types";

const emptyResolver = () => ({});

export default new GraphQLSchemaPlugin<TenancyContext>({
    typeDefs: /* GraphQL */ `
        type TenancyQuery {
            version: String
        }

        type TenancyMutation {
            install: TenancyBooleanResponse
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
            version: async (root, args, context) => {
                return await context.tenancy.system.getVersion();
            }
        },
        TenancyMutation: {
            install: async (root, args, context) => {
                try {
                    await context.tenancy.system.install();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

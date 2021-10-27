import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { SecurityContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        extend type SecurityQuery {
            "Get installed version"
            version: String
        }

        extend type SecurityMutation {
            "Install Security"
            install: SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            version: async (root, args, context) => {
                return await context.security.getVersion();
            }
        },
        SecurityMutation: {
            install: async (root, args, context) => {
                try {
                    await context.security.install();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

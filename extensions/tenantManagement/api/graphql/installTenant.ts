import { GraphQLSchemaPlugin, Response, ErrorResponse } from "@webiny/handler-graphql";
import { CreateAndInstallTenant } from "../useCases/CreateAndInstallTenant";
import type { Context } from "../types";
import { ensureAuthenticated } from "./ensureAuthenticated";

export const installTenant = () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
            extend type Mutation {
                installCompanyTenant(companyId: ID!): BooleanResponse
            }
        `,
        resolvers: {
            Mutation: {
                installCompanyTenant: async (_, args, context) => {
                    try {
                        await ensureAuthenticated(context);
                        const { companyId } = args as { companyId: string };
                        await new CreateAndInstallTenant(context).execute(companyId);
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
};

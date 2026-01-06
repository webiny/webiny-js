import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { type AppInstallationData } from "~/features/tenancy/InstallTenant/index.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { InstallSystemUseCase } from "~/features/system/InstallSystem/index.js";

const emptyResolver = () => ({});

interface InstallTenantArgs {
    installationInput: AppInstallationData[];
}

export const createSystemGraphQL = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type SystemQuery {
                isSystemInstalled: BooleanResponse
            }

            type SystemMutation {
                installSystem(installationInput: JSON!): BooleanResponse
            }

            extend type Query {
                system: SystemQuery
            }

            extend type Mutation {
                system: SystemMutation
            }
        `,
        resolvers: {
            Query: {
                system: emptyResolver
            },
            Mutation: {
                system: emptyResolver
            },
            SystemQuery: {
                isSystemInstalled: async (_, __, context) => {
                    const getRootTenant = context.container.resolve(GetRootTenantUseCase);
                    const result = await getRootTenant.execute();

                    return new Response(result.isOk());
                }
            },
            SystemMutation: {
                installSystem: async (_, args: InstallTenantArgs, context) => {
                    const installSystem = context.container.resolve(InstallSystemUseCase);

                    const result = await installSystem.execute(args.installationInput);

                    if (result.isOk()) {
                        return new Response(true);
                    }

                    return new ErrorResponse({
                        code: result.error.code,
                        message: result.error.message,
                        data: result.error.data
                    });
                }
            }
        }
    });
};

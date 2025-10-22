import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/index.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import types from "./types.gql.js";
import { type AppInstallationData } from "~/features/InstallTenant/index.js";
import { InstallSystemUseCase } from "~/features/InstallSystem/index.js";
import { GetRootTenantUseCase } from "~/features/GetRootTenant/index.js";

const emptyResolver = () => ({});

interface InstallTenantArgs {
    installationInput: AppInstallationData[];
}

export default [
    types,
    new GraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type TenancyQuery {
                isSystemInstalled: BooleanResponse
            }

            type TenancyMutation {
                installSystem(installationInput: JSON!): BooleanResponse
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

            type TenancyError {
                code: String
                message: String
                data: JSON
                stack: String
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
                isSystemInstalled: async (_, __, context) => {
                    const getRootTenant = context.container.resolve(GetRootTenantUseCase);
                    const result = await getRootTenant.execute();

                    return new Response(result.isOk());
                }
            },
            TenancyMutation: {
                installSystem: async (_, args: InstallTenantArgs, context) => {
                    const installSystem = context.container.resolve(InstallSystemUseCase);

                    console.log("installSystem", args);
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
    })
];

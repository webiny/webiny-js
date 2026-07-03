import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { type AppInstallationData } from "~/features/tenancy/InstallTenant/index.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { InstallSystemUseCase } from "~/features/system/InstallSystem/index.js";

interface InstallTenantArgs {
    installationInput: AppInstallationData[];
}

class SystemSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
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
        `);

        builder.addResolver({
            path: "Query.system",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "Mutation.system",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "SystemQuery.isSystemInstalled",
            dependencies: [GetRootTenantUseCase],
            resolver: (getRootTenant: GetRootTenantUseCase.Interface) => async () => {
                const result = await getRootTenant.execute();

                return new Response(result.isOk());
            }
        });

        builder.addResolver<InstallTenantArgs>({
            path: "SystemMutation.installSystem",
            dependencies: [InstallSystemUseCase],
            resolver:
                (installSystem: InstallSystemUseCase.Interface) =>
                async ({ args }) => {
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
        });

        return builder;
    }
}

export const SystemSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SystemSchemaFactoryImpl,
    dependencies: []
});

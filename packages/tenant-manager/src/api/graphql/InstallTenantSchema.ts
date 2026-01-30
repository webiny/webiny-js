import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { CreateAndInstallTenantUseCase } from "../features/CreateAndInstallTenant/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";

class InstallTenantSchema implements GraphQLSchemaFactory.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private installTenant: CreateAndInstallTenantUseCase.Interface
    ) {}

    async execute() {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type TenantManagerMutation {
                        installTenant(tenantId: ID!): BooleanResponse
                    }

                    extend type Mutation {
                        tenantManager: TenantManagerMutation
                    }
                `,
                resolvers: {
                    Mutation: {
                        tenantManager: () => ({})
                    },
                    TenantManagerMutation: {
                        installTenant: async (_: any, args: { tenantId: string }) => {
                            const identity = this.identityContext.getIdentity();
                            if (!identity.isAdmin()) {
                                return new NotAuthorizedResponse();
                            }

                            if (!this.identityContext.getPermission("tm.tenant")) {
                                return new NotAuthorizedResponse();
                            }

                            const result = await this.installTenant.execute(args.tenantId);
                            if (result.isFail()) {
                                return new ErrorResponse(result.error);
                            }
                            return new Response(true);
                        }
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: InstallTenantSchema,
    dependencies: [IdentityContext, CreateAndInstallTenantUseCase]
});

import { IdentityContext } from "webiny/api/security";
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { Response } from "webiny/api/graphql";
import { ErrorResponse } from "webiny/api/graphql";
import { NotAuthorizedResponse } from "webiny/api/graphql";
import { CreateAndInstallTenantUseCase } from "../features/CreateAndInstallTenant/abstractions.js";

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
                    TenantManagerMutation: {
                        installTenant: async (_: any, args: { companyId: string }) => {
                            const identity = this.identityContext.getIdentity();
                            if (!identity.isAdmin()) {
                                return new NotAuthorizedResponse();
                            }
                            const result = await this.installTenant.execute(args.companyId);
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

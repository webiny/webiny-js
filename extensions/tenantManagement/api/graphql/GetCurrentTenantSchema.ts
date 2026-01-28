import { IdentityContext } from "webiny/api/security";
import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { Response } from "webiny/api/graphql";
import { ErrorResponse } from "webiny/api/graphql";
import { NotAuthorizedResponse } from "webiny/api/graphql";
import { GetCurrentTenantUseCase } from "../features/GetCurrentTenant/abstractions.js";

class GetCurrentTenantSchema implements GraphQLSchemaFactory.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getCurrentTenant: GetCurrentTenantUseCase.Interface
    ) {}

    async execute() {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type TenantResponse {
                        data: Tenant
                        error: Error
                    }

                    type Tenant {
                        id: ID!
                        values: JSON!
                    }

                    type TenantManagerQuery {
                        getCurrentTenant: TenantResponse
                    }

                    extend type Query {
                        tenantManager: TenantManagerQuery
                    }
                `,
                resolvers: {
                    Query: {
                        getCurrentTenant: async () => {
                            const identity = this.identityContext.getIdentity();
                            if (identity.isAnonymous()) {
                                return new NotAuthorizedResponse();
                            }

                            const result = await this.getCurrentTenant.execute();
                            if (result.isFail()) {
                                return new ErrorResponse(result.error);
                            }
                            return new Response(result.value);
                        }
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: GetCurrentTenantSchema,
    dependencies: [IdentityContext, GetCurrentTenantUseCase]
});

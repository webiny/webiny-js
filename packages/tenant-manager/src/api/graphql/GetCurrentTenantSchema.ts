import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { GetCurrentTenantUseCase } from "../features/GetCurrentTenant/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";

class GetCurrentTenantSchema implements GraphQLSchemaFactory.Interface {
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
                        tenantManager: () => ({})
                    },
                    TenantManagerQuery: {
                        getCurrentTenant: async (_: any, __: any, context: any) => {
                            const identityContext = context.container.resolve(IdentityContext);
                            const getCurrentTenant =
                                context.container.resolve(GetCurrentTenantUseCase);

                            const identity = identityContext.getIdentity();
                            if (identity.isAnonymous()) {
                                return new NotAuthorizedResponse();
                            }
                            const result = await getCurrentTenant.execute();

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
    dependencies: []
});

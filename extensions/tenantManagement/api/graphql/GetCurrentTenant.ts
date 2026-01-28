import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { TenantContext } from "webiny/api/tenancy";

class GetCurrentTenant implements GraphQLSchemaFactory.Interface {
    constructor(private tenantContext: TenantContext.Interface) {}

    execute() {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type TenantError {
                        code: String
                        message: String
                        data: JSON
                        stack: String
                    }

                    type TenantTheme {
                        websiteTitle: String!
                        primaryColor: String!
                        additionalColors: [String!]
                        font: String
                    }

                    type Tenant {
                        id: ID!
                        name: String!
                        description: String!
                        theme: TenantTheme!
                    }

                    type TenantResponse {
                        data: Tenant
                        error: TenantError
                    }

                    type TenantThemeResponse {
                        data: TenantTheme
                        error: TenantError
                    }

                    extend type Query {
                        currentTenant: TenantResponse
                    }
                `,
                resolvers: {
                    Query: {
                        currentTenant: async () => {
                            try {
                                const getTenant = new GetTenantById(context);
                                const tenant = await getTenant.execute(tenant.id);

                                return new Response(tenant);
                            } catch (e) {
                                return new ErrorResponse(e);
                            }
                        }
                    }
                }
            }
        ];
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: GetCurrentTenant,
    dependencies: [TenantContext]
});

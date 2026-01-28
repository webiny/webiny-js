import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { TenantContext } from "webiny/api/tenancy";

class GetCurrentCompany implements GraphQLSchemaFactory.Interface {
    constructor(private tenantContext: TenantContext.Interface) {}

    execute() {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type CompanyError {
                        code: String
                        message: String
                        data: JSON
                        stack: String
                    }

                    type CompanyTheme {
                        websiteTitle: String!
                        primaryColor: String!
                        additionalColors: [String!]
                        font: String
                    }

                    type Company {
                        id: ID!
                        name: String!
                        description: String!
                        theme: CompanyTheme!
                    }

                    type CompanyResponse {
                        data: Company
                        error: CompanyError
                    }

                    type CompanyThemeResponse {
                        data: CompanyTheme
                        error: CompanyError
                    }

                    extend type Query {
                        currentCompany: CompanyResponse
                    }
                `,
                resolvers: {
                    Query: {
                        currentCompany: async () => {
                            try {
                                const getCompany = new GetCompanyById(context);
                                const company = await getCompany.execute(tenant.id);

                                return new Response(company);
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
    implementation: GetCurrentCompany,
    dependencies: [TenantContext]
});

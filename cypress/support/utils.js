import { GraphQLClient } from "graphql-request";

const DEFAULT_TENANT_ID = "root";

export const createGqlClient = (gqlClientOptions = {}) => {
    const gqlClient = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"));

    return {
        request: ({ query, variables, authToken, tenantId }) => {
            return gqlClient.request(query, variables, {
                authorization: `Bearer ${authToken || gqlClientOptions.authToken}`,
                ["x-tenant"]: tenantId || gqlClientOptions.tenantId || DEFAULT_TENANT_ID
            });
        }
    };
};

export const gqlClient = createGqlClient();

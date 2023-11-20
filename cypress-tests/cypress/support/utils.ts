import { GraphQLClient } from "graphql-request";
import { customAlphabet } from "nanoid";

const DEFAULT_TENANT_ID = "root";

interface CreateGqlClientParams {
    authToken?: string;
    tenantId?: string;
}

interface RequestParams {
    query: string;
    variables?: Record<string, any>;
    authToken?: string;
    tenantId?: string;
}

export const createGqlClient = (gqlClientOptions: CreateGqlClientParams = {}) => {
    const gqlClient = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"));

    return {
        request: function request<TResponse = Record<string, any>>({
            query,
            variables,
            authToken,
            tenantId
        }: RequestParams) {
            return gqlClient.request<TResponse>(query, variables, {
                authorization: `Bearer ${authToken || gqlClientOptions.authToken}`,
                ["x-tenant"]: tenantId || gqlClientOptions.tenantId || DEFAULT_TENANT_ID
            });
        }
    };
};

export const gqlClient = createGqlClient();

export const generateId = () => {
    return customAlphabet("abcdefghijklmnopqrstuvwxyz", 10)();
};

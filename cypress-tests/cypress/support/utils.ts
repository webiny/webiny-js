import { GraphQLClient } from "graphql-request";
import { customAlphabet } from "nanoid";
import { getSuperAdminUser, User } from "./login";

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

export interface GqlResponseError {
    message: string;
    code: string;
    data: any;
}

export interface GqlResponse<TData = Record<string, any>> {
    data: TData;
    error: GqlResponseError | null;
}

export interface GqlListResponse<TData = Record<string, any>, TMeta = Record<string, any>> {
    data: TData[];
    meta: TMeta;
    error: GqlResponseError | null;
}

export const createGqlClient = (gqlClientOptions: CreateGqlClientParams = {}) => {
    const gqlClient = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"));

    const request = <TResponse = Record<string, any>>({
        query,
        variables,
        authToken,
        tenantId
    }: RequestParams) => {
        return gqlClient.request<TResponse>(query, variables, {
            authorization: `Bearer ${authToken || gqlClientOptions.authToken}`,
            ["x-tenant"]: tenantId || gqlClientOptions.tenantId || DEFAULT_TENANT_ID
        });
    };

    const query = <TResponse = GqlResponse>(params: RequestParams) => {
        return request(params).then(response => {
            const [gqlOperationName] = Object.keys(response.data);
            return response.data[gqlOperationName] as TResponse;
        });
    };

    return {
        request,
        query
    };
};

export const gqlClient = createGqlClient();

type GqlQueryFunctionParams<TVars> = { user?: User; variables?: TVars };

type GqlQueryFunction<TReturn, TVars> = (params: GqlQueryFunctionParams<TVars>) => Promise<TReturn>;

export const createGqlQuery = <TResponse, TVars = Record<string, never>>(
    query: string
): GqlQueryFunction<TResponse, TVars> => {
    return async params => {
        let user = params.user;
        if (!user) {
            user = await getSuperAdminUser();
        }

        const authToken = user?.idToken.jwtToken;

        const { variables } = params;

        return gqlClient.query({
            query,
            variables,
            authToken
        });
    };
};

export const generateId = () => {
    return customAlphabet("abcdefghijklmnopqrstuvwxyz", 10)();
};

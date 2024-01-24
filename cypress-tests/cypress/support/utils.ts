import { GraphQLClient } from "graphql-request";
import { getSuperAdminUser, User } from "./login";
import { generateAlphaLowerCaseId } from "@webiny/utils/generateId";

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
            // TODO: could be improved.
            const [appName] = Object.keys(response);
            const [gqlOperationName] = Object.keys(response[appName]);

            const data = response[appName][gqlOperationName] as TResponse;

            if (response.error) {
                console.error(
                    `An error occurred while executing ${appName}.${gqlOperationName} GraphQl operation.`,
                    {
                        params,
                        response
                    }
                );
            }

            return data;
        });
    };

    return {
        request,
        query
    };
};

export const gqlClient = createGqlClient();

interface GqlQueryOptions {
    user?: User;
}

type GqlQueryFunction<TReturn, TVariables> = (
    variables: TVariables,
    options?: GqlQueryOptions
) => Promise<TReturn>;

export const createGqlQuery = <TReturn, TVariables = Record<string, never>>(
    query: string
): GqlQueryFunction<TReturn, TVariables> => {
    return async (variables: TVariables, options?: GqlQueryOptions) => {
        let user = options?.user;
        if (!user) {
            user = await getSuperAdminUser();
        }

        const authToken = user?.idToken.jwtToken;

        return gqlClient.query({
            query,
            variables,
            authToken
        });
    };
};

export const generateId = () => {
    return generateAlphaLowerCaseId(10);
};

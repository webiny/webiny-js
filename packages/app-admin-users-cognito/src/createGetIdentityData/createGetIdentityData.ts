import { LOGIN } from "./graphql.js";
import type { DocumentNode } from "graphql";
import type { ApolloClient } from "apollo-client";

export interface GetIdentityDataCallableParams {
    client: ApolloClient<any>;
}
export interface GetIdentityDataCallableResponse {
    [key: string]: string;
}
export interface GetIdentityDataCallable {
    (params: GetIdentityDataCallableParams): Promise<GetIdentityDataCallableResponse>;
}
export interface CreateGetIdentityDataCallable {
    (mutation?: DocumentNode): GetIdentityDataCallable;
}
/**
 * A factory
 */
export const createGetIdentityData: CreateGetIdentityDataCallable = (mutation = LOGIN) => {
    return async ({ client }) => {
        const response = await client.mutate({ mutation });
        const { data, error } = response.data.security.login;
        if (error) {
            throw new Error(error.message);
        }

        return data;
    };
};

import { LOGIN } from "./graphql.js";
import type ApolloClient from "apollo-client";
import type { DocumentNode } from "graphql";

export interface GetIdentityDataParams {
    client: ApolloClient<any>;
}
export interface GetIdentityDataResponse {
    [key: string]: string;
}
export interface GetIdentityDataCallable {
    (params: GetIdentityDataParams): Promise<GetIdentityDataResponse>;
}
export interface CreateGetIdentityDataCallable {
    (mutation?: DocumentNode): GetIdentityDataCallable;
}
export const createGetIdentityData: CreateGetIdentityDataCallable = (mutation = LOGIN) => {
    return async params => {
        const { client } = params;
        const response = await client.mutate({ mutation });
        const { data, error } = response.data.security.login;
        if (error) {
            throw new Error(error.message);
        }

        return data;
    };
};

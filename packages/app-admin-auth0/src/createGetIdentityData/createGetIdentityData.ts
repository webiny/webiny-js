import { LOGIN_ST } from "./graphql";
import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";

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
export const createGetIdentityData: CreateGetIdentityDataCallable = (mutation = LOGIN_ST) => {
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

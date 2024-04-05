import { ApolloClient, ApolloQueryResult, MutationOptions, QueryOptions } from "apollo-client";
import { FetchResult } from "apollo-link";
import { ILockingMechanismClient } from "~/domain/abstractions/ILockingMechanismClient";

export interface ILockingMechanismClientParams {
    client: ApolloClient<any>;
}

export class LockingMechanismClient implements ILockingMechanismClient {
    private readonly client: ApolloClient<any>;

    public constructor(params: ILockingMechanismClientParams) {
        this.client = params.client;
    }

    public async query<T, R>(params: QueryOptions<R>): Promise<ApolloQueryResult<T>> {
        return this.client.query<T, R>({
            ...params,
            fetchPolicy: "network-only"
        });
    }

    public async mutation<T, R>(options: MutationOptions<T, R>): Promise<FetchResult<T>> {
        return this.client.mutate<T, R>({
            ...options,
            fetchPolicy: "no-cache"
        });
    }
}

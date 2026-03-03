import type { ApolloClient, ApolloQueryResult, MutationOptions, QueryOptions } from "apollo-client";
import type { FetchResult } from "apollo-link";
import type { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient.js";

export interface IRecordLockingClientParams {
    client: ApolloClient;
}

export class RecordLockingClient implements IRecordLockingClient {
    private readonly client: ApolloClient;

    public constructor(params: IRecordLockingClientParams) {
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

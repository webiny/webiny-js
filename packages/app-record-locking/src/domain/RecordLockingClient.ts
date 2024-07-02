import { ApolloClient, ApolloQueryResult, MutationOptions, QueryOptions } from "apollo-client";
import { FetchResult } from "apollo-link";
import { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient";

export interface IRecordLockingClientParams {
    client: ApolloClient<any>;
}

export class RecordLockingClient implements IRecordLockingClient {
    private readonly client: ApolloClient<any>;

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

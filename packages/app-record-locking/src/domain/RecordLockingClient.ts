import type { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient.js";
import type { useMutation, useQuery } from "@apollo/client/react";
import type { ApolloClient } from "@apollo/client";

export interface IRecordLockingClientParams {
    client: ApolloClient;
}

export class RecordLockingClient implements IRecordLockingClient {
    private readonly client: ApolloClient;

    public constructor(params: IRecordLockingClientParams) {
        this.client = params.client;
    }

    public async query<T, R>(params: useQuery.Options<R>): Promise<useQuery.Result<T>> {
        return this.client.query<T, R>({
            ...params,
            fetchPolicy: "network-only"
        });
    }

    public async mutation<T, R>(
        options: useMutation.Options<T, R>
    ): Promise<useMutation.Result<T>> {
        return this.client.mutate<T, R>({
            ...options,
            fetchPolicy: "no-cache"
        });
    }
}

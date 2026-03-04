import type { IRecordLockingClient } from "~/domain/abstractions/IRecordLockingClient.js";
import type { ApolloClient } from "@apollo/client";
import type { OperationVariables } from "@apollo/client/core/types.js";

export interface IRecordLockingClientParams {
    client: ApolloClient;
}

export class RecordLockingClient implements IRecordLockingClient {
    private readonly client: ApolloClient;

    public constructor(params: IRecordLockingClientParams) {
        this.client = params.client;
    }

    public async query<T, R extends OperationVariables = OperationVariables>(
        params: ApolloClient.QueryOptions<R>
    ): Promise<ApolloClient.QueryResult<T>> {
        return this.client.query<T, R>({
            ...params,
            variables: params.variables as R,
            fetchPolicy: "network-only"
        });
    }

    public async mutation<T, R extends OperationVariables = OperationVariables>(
        options: ApolloClient.MutateOptions<T, R>
    ): Promise<ApolloClient.MutateResult<T>> {
        return this.client.mutate<T, R>({
            ...options,
            fetchPolicy: "no-cache"
        });
    }
}

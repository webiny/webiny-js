import type { ApolloClient } from "@apollo/client";
import type { OperationVariables } from "@apollo/client/core/types.js";

export interface IRecordLockingClient {
    query<T, R extends OperationVariables = OperationVariables>(
        params: ApolloClient.QueryOptions<R>
    ): Promise<ApolloClient.QueryResult<T>>;
    mutation<T, R extends OperationVariables>(
        options: ApolloClient.MutateOptions<T, R>
    ): Promise<ApolloClient.MutateResult<T>>;
}

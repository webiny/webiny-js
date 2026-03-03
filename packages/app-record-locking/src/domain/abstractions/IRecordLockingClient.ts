import type { useMutation, useQuery } from "@apollo/client/react";
import type { OperationVariables } from "@apollo/client/core/types.js";

export interface IRecordLockingClient {
    query<T, R>(params: useQuery.Options<R>): Promise<useQuery.Result<T>>;
    mutation<T, R extends OperationVariables>(
        options: useMutation.Options<T, R>
    ): Promise<useMutation.Result<T>>;
}

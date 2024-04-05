import { ApolloQueryResult, QueryOptions, MutationOptions } from "apollo-client";
import { FetchResult } from "apollo-link";

export interface ILockingMechanismClient {
    query<T, R>(params: QueryOptions<R>): Promise<ApolloQueryResult<T>>;
    mutation<T, R>(options: MutationOptions<T, R>): Promise<FetchResult<T>>;
}

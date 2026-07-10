import { Abstraction } from "@webiny/di";
import type { Db } from "@webiny/db";

// Re-export Bruno's DynamoDBClient abstraction + feature for convenience
export { DynamoDBClient, DynamoDBClientFeature } from "@webiny/db-dynamodb";

/**
 * The full Db instance (driver + key-value store). The DI-native replacement for the old
 * `context.db` bag — resolve this instead of reading the context.
 */
export const DbInstance = new Abstraction<Db<unknown>>("DbInstance");

export namespace DbInstance {
    export type Interface = Db<unknown>;
}

export { Entity, Table } from "dynamodb-toolbox";

import { Entity, Table } from "dynamodb-toolbox";

export type ScanOptions = NonNullable<Parameters<Entity["scan"]>[0]>;
export type DynamoDBTypes =
    | "string"
    | "boolean"
    | "number"
    | "bigint"
    | "list"
    | "map"
    | "binary"
    | "set";

type Key = string | number | symbol;

export type TableDef = Table<string, Key, Key | null>;
export type TableConstructor<
    A extends string,
    B extends Key,
    C extends Key
> = ConstructorParameters<typeof Table<A, B, C>>[0];

// TODO: this needs to be replaced with either inferred types, or manual cherry picked types.
export type {
    EntityConstructor,
    Readonly,
    AttributeDefinition,
    EntityQueryOptions,
    AttributeDefinitions
} from "dynamodb-toolbox/dist/cjs/classes/Entity/index.js";

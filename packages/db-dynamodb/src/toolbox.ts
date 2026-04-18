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

// Types previously imported from dynamodb-toolbox internals.
// Declared locally to avoid deep path imports blocked by moduleResolution: bundler.
export type Readonly<T> = T extends ((...args: any[]) => any) | undefined
    ? T
    : T extends object
      ? { readonly [P in keyof T]: Readonly<T[P]> }
      : T;

export type AttributeDefinition =
    | DynamoDBTypes
    | Partial<{
          type: DynamoDBTypes;
          coerce: boolean;
          default: unknown;
          dependsOn: string | string[];
          required: boolean | "always";
          hidden: boolean;
          prefix: string;
          suffix: string;
          delimiter: string;
          map: string;
          alias: string;
          onlyMap: boolean;
          partitionKey: boolean;
          sortKey: boolean;
          [key: string]: unknown;
      }>
    | [string, number]
    | [string, number, string]
    | [string, number, Record<string, unknown>];

export type AttributeDefinitions = Record<PropertyKey, AttributeDefinition>;

export interface EntityConstructor<
    T extends Readonly<AttributeDefinitions> = Readonly<AttributeDefinitions>
> {
    name: string;
    attributes: T;
    table?: TableDef;
    timestamps?: boolean;
    createdAlias?: string;
    modifiedAlias?: string;
    typeAlias?: string;
    typeHidden?: boolean;
    autoExecute?: boolean;
    autoParse?: boolean;
}

export interface EntityQueryOptions {
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
    capacity?: "indexes" | "total" | "none";
    select?: "all_attributes" | "all_projected_attributes" | "count" | "specific_attributes";
    eq?: string | number;
    lt?: string | number;
    lte?: string | number;
    gt?: string | number;
    gte?: string | number;
    between?: [string, string] | [number, number] | [bigint, bigint];
    beginsWith?: string;
    startKey?: Record<string, unknown>;
    filters?: Record<string, unknown>;
    attributes?: string[];
    execute?: boolean;
    parse?: boolean;
}

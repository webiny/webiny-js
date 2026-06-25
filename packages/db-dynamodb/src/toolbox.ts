export type {
    DynamoDBTypes,
    AttributeDefinition,
    AttributeDefinitions
} from "~/utils/EntitySchema.js";

import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

export type TableDef = DynamoDbDocumentClient.Interface;

import type { AttributeDefinitions } from "~/utils/EntitySchema.js";

export type Readonly<T> = T extends ((...args: any[]) => any) | undefined
    ? T
    : T extends object
      ? { readonly [P in keyof T]: Readonly<T[P]> }
      : T;

export interface EntityConstructor<
    T extends Readonly<AttributeDefinitions> = Readonly<AttributeDefinitions>
> {
    name: string;
    attributes: T;
    table?: DynamoDbDocumentClient.Interface;
    timestamps?: boolean;
}

export interface EntityQueryOptions {
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
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
}

export type ScanOptions = {
    index?: string;
    limit?: number;
    startKey?: Record<string, unknown>;
    segment?: number;
    totalSegments?: number;
    filters?: Record<string, unknown>;
    consistent?: boolean;
};

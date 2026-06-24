import type { GenericRecord } from "@webiny/api/types.js";

export type DynamoDBTypes =
    | "string"
    | "boolean"
    | "number"
    | "bigint"
    | "list"
    | "map"
    | "binary"
    | "set";

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

/* Keys added by DynamoDB infrastructure or dynamodb-toolbox that must be stripped during unmarshal. */
const INFRASTRUCTURE_KEYS = new Set([
    "PK",
    "SK",
    "created",
    "_ct",
    "modified",
    "_mt",
    "entity",
    "_et",
    "GSI1_PK",
    "GSI1_SK",
    "GSI2_PK",
    "GSI2_SK",
    "GSI3_PK",
    "GSI3_SK",
    "GSI4_PK",
    "GSI4_SK",
    "GSI5_PK",
    "GSI5_SK",
    "GSI_TENANT",
    "TYPE"
]);

export interface IEntitySchemaParams {
    name: string;
    attributes: AttributeDefinitions;
    timestamps?: boolean;
}

export class EntitySchema {
    public readonly name: string;
    private readonly attributes: AttributeDefinitions;
    private readonly schemaKeys: Set<string>;
    private readonly useTimestamps: boolean;

    public constructor(params: IEntitySchemaParams) {
        this.name = params.name;
        this.attributes = params.attributes;
        this.schemaKeys = new Set(Object.keys(params.attributes).map(k => String(k)));
        /* Timestamps default to true, matching dynamodb-toolbox behavior. */
        if (params.timestamps === undefined) {
            this.useTimestamps = true;
        } else {
            this.useTimestamps = params.timestamps;
        }
    }

    /* Returns the set of attribute names defined in the schema. */
    public getSchemaAttributes(): Set<string> {
        return new Set(this.schemaKeys);
    }

    /* Returns the raw attributes definition. */
    public getAttributes(): AttributeDefinitions {
        return this.attributes;
    }

    /* Adds _et (and optionally _ct/_mt timestamps) to an item. */
    public marshal<T extends GenericRecord>(item: T): T & { _et: string } {
        const now = new Date().toISOString();
        const result = {
            ...item,
            _et: this.name
        };

        if (this.useTimestamps) {
            /* _ct is only set if not already present on the item. */
            if (!item["_ct"]) {
                (result as GenericRecord)["_ct"] = now;
            }
            (result as GenericRecord)["_mt"] = now;
        }

        return result;
    }

    /* Strips infrastructure keys, keeping only schema-defined non-infrastructure keys. */
    public unmarshal<T = GenericRecord>(item: GenericRecord): T {
        const result: GenericRecord = {};

        for (const key in item) {
            if (!Object.prototype.hasOwnProperty.call(item, key)) {
                continue;
            }
            /* Keep only keys that are in the schema AND are not infrastructure keys. */
            if (this.schemaKeys.has(key) && !INFRASTRUCTURE_KEYS.has(key)) {
                result[key] = item[key];
            }
        }

        return result as T;
    }

    /* Wraps item in PutRequest format for batch writes. */
    public toPutRequest<T extends GenericRecord>(
        item: T
    ): { PutRequest: { Item: T & { _et: string } } } {
        const marshalledItem = this.marshal(item);
        return {
            PutRequest: {
                Item: marshalledItem
            }
        };
    }

    /* Wraps keys in DeleteRequest format for batch writes. */
    public toDeleteRequest(keys: GenericRecord): { DeleteRequest: { Key: GenericRecord } } {
        return {
            DeleteRequest: {
                Key: { ...keys }
            }
        };
    }

    /* Returns a copy of the keys for batch get. */
    public toGetKeys(keys: GenericRecord): GenericRecord {
        return { ...keys };
    }
}

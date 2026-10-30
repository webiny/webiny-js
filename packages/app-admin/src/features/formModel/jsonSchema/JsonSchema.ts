export type JsonSchemaType =
    | "object"
    | "array"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "integer";

export type JsonSchemaEnumValue = string | number | boolean | null;

/*
 * The part of JSON schema the adapter reads, typed to stay assignable to zod's JSON schema type
 * (`z.fromJSONSchema` takes it). `ui` is the hint zod `.meta({ ui })` writes next to the standard
 * keywords (`textarea`, `team`, `user`); the index signature keeps every other keyword a schema
 * may carry. A schema whose `type` is anything else (a list of types, a missing type) renders as a
 * JSON text field.
 */
export interface JsonSchema {
    type?: JsonSchemaType;
    title?: string;
    description?: string;
    default?: unknown;
    enum?: JsonSchemaEnumValue[];
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    ui?: string;
    [keyword: string]: unknown;
}

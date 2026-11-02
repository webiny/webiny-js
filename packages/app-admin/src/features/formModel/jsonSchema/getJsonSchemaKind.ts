import type { JsonSchema } from "./JsonSchema.js";

export type JsonSchemaKind =
    | "string"
    | "enum"
    | "number"
    | "boolean"
    | "object"
    | "stringList"
    | "objectList"
    | "json";

const isNumberType = (type: unknown): boolean => {
    return type === "number" || type === "integer";
};

const hasEnumValues = (schema: JsonSchema): boolean => {
    return Array.isArray(schema.enum) && schema.enum.length > 0;
};

const hasEnumOfType = (schema: JsonSchema, valueType: string): boolean => {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
        return false;
    }
    return schema.enum.every(value => typeof value === valueType);
};

const getArrayKind = (schema: JsonSchema): JsonSchemaKind => {
    const items = schema.items;
    if (!items || typeof items !== "object") {
        return "json";
    }
    if (items.type === "string" && !hasEnumValues(items)) {
        return "stringList";
    }
    if (items.type === "object" && items.properties && typeof items.properties === "object") {
        return "objectList";
    }
    return "json";
};

/*
 * How the adapter renders a property: one of the supported shapes, or `json` (a JSON text field)
 * for everything else. A schema that is not an object returns `json`, so a malformed property
 * never crashes the builder.
 */
export const getJsonSchemaKind = (schema: JsonSchema): JsonSchemaKind => {
    if (!schema || typeof schema !== "object") {
        return "json";
    }
    if (schema.type === "string") {
        if (hasEnumValues(schema)) {
            return hasEnumOfType(schema, "string") ? "enum" : "json";
        }
        return "string";
    }
    if (isNumberType(schema.type)) {
        if (hasEnumValues(schema)) {
            return hasEnumOfType(schema, "number") ? "enum" : "json";
        }
        return "number";
    }
    if (schema.type === "boolean") {
        return "boolean";
    }
    if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
        return "object";
    }
    if (schema.type === "array") {
        return getArrayKind(schema);
    }
    return "json";
};

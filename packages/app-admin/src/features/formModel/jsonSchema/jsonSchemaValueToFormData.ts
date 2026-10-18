import type { JsonSchema } from "./JsonSchema.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";
import { isPlainObject } from "./isPlainObject.js";
import type { PlainObject } from "./isPlainObject.js";

const toFormValue = (schema: JsonSchema, value: unknown): unknown => {
    const kind = getJsonSchemaKind(schema);
    const input = value === undefined ? schema.default : value;

    if (kind === "object") {
        return jsonSchemaValueToFormData(schema, input);
    }
    if (kind === "objectList") {
        const items = Array.isArray(input) ? input : [];
        const itemSchema = normalizeJsonSchema(schema.items);
        return items.map(item => jsonSchemaValueToFormData(itemSchema, item));
    }
    if (kind === "stringList") {
        return Array.isArray(input) ? input : [];
    }
    if (kind === "json") {
        return input === undefined ? null : JSON.stringify(input, null, 2);
    }
    return input === undefined ? null : input;
};

/*
 * Converts a stored value into form data for the fields `buildFieldsFromJsonSchema` builds
 * (R271): every property is present (its default, else `null`, `[]` for a list), a nested object
 * and each list item become form data too, and a JSON text field holds the stringified value.
 */
export const jsonSchemaValueToFormData = (schema: JsonSchema, value: unknown): PlainObject => {
    const data: PlainObject = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return data;
    }

    const source: PlainObject = isPlainObject(value) ? value : {};
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const propertySchema = normalizeJsonSchema(property);
        data[name] = toFormValue(propertySchema, source[name]);
    }

    return data;
};

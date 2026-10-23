import type { JsonSchema } from "./JsonSchema.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";
import { isPlainObject } from "./isPlainObject.js";
import type { PlainObject } from "./PlainObject.js";

const parseJsonText = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        // The text stays as typed; the field's own check reports it before a save.
        return text;
    }
};

const isEmptyScalar = (value: unknown): boolean => {
    return value === null || value === undefined || value === "";
};

/*
 * The value of one property, or `undefined` to leave the key out. An empty scalar is left out,
 * except a cleared string with a default; an empty list or object is left out too unless the
 * property is required.
 */
const toSchemaValue = (schema: JsonSchema, data: unknown, isRequired: boolean): unknown => {
    const kind = getJsonSchemaKind(schema);

    if (kind === "object") {
        const nested = formDataToJsonSchemaValue(schema, data);
        return Object.keys(nested).length > 0 || isRequired ? nested : undefined;
    }
    if (kind === "objectList") {
        const items = Array.isArray(data) ? data : [];
        const itemSchema = normalizeJsonSchema(schema.items);
        const values = items.map(item => formDataToJsonSchemaValue(itemSchema, item));
        return values.length > 0 || isRequired ? values : undefined;
    }
    if (kind === "stringList") {
        const items = Array.isArray(data) ? data : [];
        return items.length > 0 || isRequired ? items : undefined;
    }
    // A cleared string with a default is kept: left out, the default would come back on reload.
    if (kind === "string" && data === "" && schema.default !== undefined) {
        return "";
    }
    if (isEmptyScalar(data)) {
        return undefined;
    }
    if (kind === "json") {
        const text = String(data);
        return text.trim() === "" ? undefined : parseJsonText(text);
    }
    return data;
};

/*
 * Converts form data back into the stored value (R271): empty fields are left out, a JSON text
 * field is parsed (text that does not parse is kept as typed), a nested object and each list item
 * convert the same way. The inverse of `jsonSchemaValueToFormData`.
 */
export const formDataToJsonSchemaValue = (schema: JsonSchema, data: unknown): PlainObject => {
    const value: PlainObject = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return value;
    }

    const source: PlainObject = isPlainObject(data) ? data : {};
    const requiredNames = Array.isArray(schema.required) ? schema.required : [];
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const isRequired = requiredNames.includes(name);
        const propertySchema = normalizeJsonSchema(property);
        const propertyValue = toSchemaValue(propertySchema, source[name], isRequired);
        if (propertyValue !== undefined) {
            value[name] = propertyValue;
        }
    }

    return value;
};

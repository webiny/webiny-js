import { z } from "zod";
import type { IFieldBuilder } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";
import type { JsonSchema } from "./JsonSchema.js";
import type { JsonSchemaFieldOptions } from "./JsonSchemaFieldOptions.js";
import type { JsonSchemaKind } from "./getJsonSchemaKind.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";

interface PropertyParams {
    name: string;
    schema: JsonSchema;
    isRequired: boolean;
    registry: IFieldBuilderRegistry;
    options: JsonSchemaFieldOptions;
}

// A switch always has a value and a nested object is required through its own properties.
const KINDS_WITHOUT_REQUIRED: JsonSchemaKind[] = ["boolean", "object"];

// Blank text means "not set" (`formDataToJsonSchemaValue` leaves it out), so it is valid here.
const isJsonText = (value: string): boolean => {
    if (value.trim() === "") {
        return true;
    }
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
};

const createNumberSchema = (schema: JsonSchema): z.ZodTypeAny | null => {
    const { minimum, maximum, exclusiveMinimum, exclusiveMaximum } = schema;
    const hasMinimum = typeof minimum === "number";
    const hasMaximum = typeof maximum === "number";
    let numberSchema = z.number();
    let constrained = false;

    if (schema.type === "integer") {
        numberSchema = numberSchema.int("Enter a whole number.");
        constrained = true;
    }
    if (hasMinimum && hasMaximum) {
        const message = `Enter a number from ${minimum} to ${maximum}.`;
        numberSchema = numberSchema.min(minimum, message).max(maximum, message);
        constrained = true;
    } else if (hasMinimum) {
        numberSchema = numberSchema.min(minimum, `Enter a number of at least ${minimum}.`);
        constrained = true;
    } else if (hasMaximum) {
        numberSchema = numberSchema.max(maximum, `Enter a number of at most ${maximum}.`);
        constrained = true;
    }
    if (typeof exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(exclusiveMinimum);
        constrained = true;
    }
    if (typeof exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(exclusiveMaximum);
        constrained = true;
    }
    return constrained ? numberSchema : null;
};

const createEnumBuilder = (params: PropertyParams): IFieldBuilder => {
    const { schema, registry } = params;
    const values = schema.enum ?? [];
    if (schema.type === "string") {
        const stringOptions = values.map(value => ({ label: String(value), value: String(value) }));
        return registry.text().options(stringOptions);
    }
    const numberOptions = values.map(value => ({ label: String(value), value: Number(value) }));
    return registry.number().options(numberOptions);
};

const createStringBuilder = (params: PropertyParams): IFieldBuilder => {
    const { schema, registry, options } = params;
    const builder = registry.text();
    const hint = schema.ui;
    if (hint === "textarea") {
        return builder.renderer("textarea");
    }
    if (typeof hint === "string") {
        const renderer = options.uiRenderers[hint];
        if (typeof renderer === "string") {
            return builder.renderer(renderer);
        }
    }
    return builder;
};

const createNumberBuilder = (params: PropertyParams): IFieldBuilder => {
    const builder = params.registry.number();
    const numberSchema = createNumberSchema(params.schema);
    if (numberSchema) {
        builder.schema(numberSchema);
    }
    return builder;
};

const createJsonBuilder = (params: PropertyParams): IFieldBuilder => {
    const builder = params.registry.text();
    builder.renderer("codeEditor", { language: "json" });
    builder.schema(z.string().refine(isJsonText, "Enter valid JSON."));
    return builder;
};

const createObjectBuilder = (params: PropertyParams, isList: boolean): IFieldBuilder => {
    const { schema, registry, options } = params;
    const itemSchema = isList ? normalizeJsonSchema(schema.items) : schema;
    const builder = registry.object();
    if (isList) {
        builder.list();
    }
    return builder.fields(inner => buildFieldsFromJsonSchema(itemSchema, inner, options));
};

const createBuilder = (kind: JsonSchemaKind, params: PropertyParams): IFieldBuilder => {
    switch (kind) {
        case "string":
            return createStringBuilder(params);
        case "enum":
            return createEnumBuilder(params);
        case "number":
            return createNumberBuilder(params);
        case "boolean":
            return params.registry.boolean();
        case "object":
            return createObjectBuilder(params, false);
        case "stringList":
            return params.registry.text().list().renderer("tags");
        case "objectList":
            return createObjectBuilder(params, true);
        default:
            return createJsonBuilder(params);
    }
};

// Object kinds take their defaults through `jsonSchemaValueToFormData`, not the builder.
const getDefaultValue = (kind: JsonSchemaKind, schema: JsonSchema): unknown => {
    if (schema.default === undefined || kind === "object" || kind === "objectList") {
        return undefined;
    }
    if (kind === "json") {
        return JSON.stringify(schema.default, null, 2);
    }
    return schema.default;
};

const createField = (params: PropertyParams): IFieldBuilder => {
    const { name, schema, isRequired } = params;
    const kind = getJsonSchemaKind(schema);
    const label = typeof schema.title === "string" && schema.title !== "" ? schema.title : name;
    const builder = createBuilder(kind, params);

    builder.label(label);
    if (typeof schema.description === "string" && schema.description !== "") {
        builder.help(schema.description);
    }

    const defaultValue = getDefaultValue(kind, schema);
    if (defaultValue !== undefined) {
        builder.defaultValue(defaultValue);
    }

    const canBeRequired = !KINDS_WITHOUT_REQUIRED.includes(kind);
    if (isRequired && schema.default === undefined && canBeRequired) {
        builder.required(`${label} is required.`);
    }
    return builder;
};

/*
 * Builds the FormModel fields of a JSON schema's properties (R271). A schema that is not an object
 * has no fields. The `required` list of an object marks its properties required, except a
 * property with a `default`, a switch and a nested object (its own properties are required).
 */
export const buildFieldsFromJsonSchema = (
    schema: JsonSchema,
    registry: IFieldBuilderRegistry,
    options: JsonSchemaFieldOptions
): Record<string, IFieldBuilder> => {
    const fields: Record<string, IFieldBuilder> = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return fields;
    }

    const requiredNames = Array.isArray(schema.required) ? schema.required : [];
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const propertySchema = normalizeJsonSchema(property);
        const isRequired = requiredNames.includes(name);
        fields[name] = createField({ name, schema: propertySchema, isRequired, registry, options });
    }

    return fields;
};

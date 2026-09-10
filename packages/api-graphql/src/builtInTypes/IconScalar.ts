import { GraphQLScalarType, GraphQLError } from "graphql";
import { Kind } from "graphql/language/index.js";

export const IconScalar = new GraphQLScalarType({
    name: "Icon",
    description: "Icon scalar that accepts string or object {type, name, value}",

    // Serialize for output - always return object structure
    serialize(value: any) {
        if (typeof value === "string") {
            return { type: "icon", name: value, value: undefined };
        }

        if (value && typeof value === "object") {
            // Validate structure
            if (typeof value.type !== "string" || typeof value.name !== "string") {
                throw new GraphQLError("Icon object must have string type and name");
            }

            return {
                type: value.type,
                name: value.name,
                value: value.value
            };
        }

        throw new GraphQLError("Icon must be a string or object");
    },

    // Parse from variables (JSON input)
    parseValue(value: any) {
        // String input → convert to object
        if (typeof value === "string") {
            return { type: "icon", name: value };
        }

        // Object input → validate and return
        if (value && typeof value === "object") {
            if (typeof value.type !== "string" || typeof value.name !== "string") {
                throw new GraphQLError("Icon object must have string type and name");
            }

            if (value.value !== undefined && typeof value.value !== "string") {
                throw new GraphQLError("Icon value must be a string if provided");
            }

            return {
                type: value.type,
                name: value.name,
                ...(value.value !== undefined && { value: value.value })
            };
        }

        throw new GraphQLError("Icon must be a string or object");
    },

    // Parse from inline query literals
    parseLiteral(ast) {
        // String literal
        if (ast.kind === Kind.STRING) {
            return { type: "icon", name: ast.value };
        }

        // Object literal
        if (ast.kind === Kind.OBJECT) {
            const fields: Record<string, string> = {};

            ast.fields.forEach(field => {
                if (field.value.kind === Kind.STRING) {
                    fields[field.name.value] = field.value.value;
                } else {
                    throw new GraphQLError("Icon object fields must be strings");
                }
            });

            // Validate required fields
            if (!fields.type || !fields.name) {
                throw new GraphQLError("Icon object must have type and name");
            }

            return {
                type: fields.type,
                name: fields.name,
                ...(fields.value && { value: fields.value })
            };
        }

        throw new GraphQLError("Icon must be a string or object literal");
    }
});

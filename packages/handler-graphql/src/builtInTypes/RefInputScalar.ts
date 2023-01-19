import { GraphQLScalarType } from "graphql";

const isMongoId = (value: any): string => {
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
        return value;
    }

    throw new Error("Must be a valid Mongo ID!");
};

export const RefInputScalar = new GraphQLScalarType({
    name: "RefInput",
    description:
        "A custom input type to be used with references. Supports plain ID and `{ id: ID }` Object literal.",
    serialize: value => {
        if (!value || value.id === null) {
            return null;
        }

        return typeof value === "string" ? value : value.id;
    },
    parseValue: value => {
        if (!value || value.id === null) {
            return null;
        }

        if (typeof value === "string") {
            return isMongoId(value);
        }

        if ("id" in value) {
            return isMongoId(value.id);
        }

        throw new Error("Invalid RefInput value!");
    },
    parseLiteral: ast => {
        if (ast.kind === "StringValue") {
            return isMongoId(ast.value);
        }

        if (ast.kind === "ObjectValue") {
            for (let i = 0; i < ast.fields.length; i++) {
                const { name, value } = ast.fields[i];
                if (name.value === "id") {
                    // @ts-ignore
                    return isMongoId(value.value);
                }
            }
        }

        throw new Error("Invalid RefInput value!");
    }
});

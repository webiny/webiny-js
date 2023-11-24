import { GraphQLScalarType } from "graphql";

const tests = [
    {
        re: /^([0-9a-zA-Z_-]+)$/,
        message: "Must be a string matching a-z, A-Z, 0-9, underscore (_) or dash(-)!"
    },
    {
        re: /^-/,
        message: "Must not start with a dash (-)!"
    },
    {
        re: /-$/,
        message: "Must not end with a dash (-)!"
    },
    {
        re: /^_/,
        message: "Must not start with an underscore (_)!"
    },
    {
        re: /_$/,
        message: "Must not end with an underscore (_)!"
    }
];

const isValidId = (value: any): string => {
    if (typeof value !== "string" || value.length < 1) {
        throw new Error("Must be a string with at least 1 character!");
    }
    for (const test of tests) {
        if (test.re.test(value) === null) {
            throw new Error(test.message);
        }
    }
    return value;
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
            return isValidId(value);
        }

        if ("id" in value) {
            return isValidId(value.id);
        }

        throw new Error("Invalid RefInput value!");
    },
    parseLiteral: ast => {
        if (ast.kind === "StringValue") {
            return isValidId(ast.value);
        }

        if (ast.kind === "ObjectValue") {
            for (let i = 0; i < ast.fields.length; i++) {
                const { name, value } = ast.fields[i];
                if (name.value === "id") {
                    // @ts-expect-error
                    return isValidId(value.value);
                }
            }
        }

        throw new Error("Invalid RefInput value!");
    }
});

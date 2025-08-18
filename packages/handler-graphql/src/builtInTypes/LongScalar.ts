import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import WebinyError from "@webiny/error";

const parseValue = (value: any) => {
    if (String(value).includes(".")) {
        throw new WebinyError("Value sent must be an integer.", "INVALID_VALUE", {
            value
        });
    }
    if (typeof value === "number") {
        return value;
    }

    if (value === null || value === undefined) {
        return null;
    }

    if (isNaN(value) === true) {
        throw new WebinyError("Value sent must be an integer.", "INVALID_VALUE", {
            value
        });
    }

    return parseInt(value);
};

export const LongScalar = new GraphQLScalarType({
    name: "Long",
    description: "A custom input type to be used for large integers (Long).",
    serialize: (value: any) => {
        try {
            return parseValue(value);
        } catch {
            console.log({
                message: "Value sent must be an integer.",
                code: "INVALID_VALUE",
                data: {
                    value
                }
            });
            return null;
        }
    },
    parseValue,
    parseLiteral: ast => {
        if (ast.kind === Kind.INT) {
            return parseInt(ast.value);
        }

        throw new Error(`Expected type Long, found {${ast.kind}}`);
    }
});

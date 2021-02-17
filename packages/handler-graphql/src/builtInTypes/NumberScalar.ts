import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import WebinyError from "@webiny/error";

const parseValue = (value: any) => {
    if (String(value).match(/^0x/) !== null) {
        throw new WebinyError("Value sent must be a non-hex number.", "INVALID_VALUE", {
            value
        });
    } else if (typeof value === "number") {
        return value;
    } else if (value === null || value === undefined) {
        return null;
    } else if (isNaN(value) === true) {
        throw new WebinyError("Value sent must be a number.", "INVALID_VALUE", {
            value
        });
    }
    return parseFloat(value);
};

export const Number = new GraphQLScalarType({
    name: "Number",
    description: "A custom input type to be used with numbers. Supports Int and Float.",
    serialize: (value: any) => {
        try {
            return parseValue(value);
        } catch (ex) {
            console.log({
                message: "Value sent must be a number.",
                code: "INVALID_VALUE",
                data: {
                    value
                }
            });
            return null;
        }
    },
    parseValue,
    parseLiteral: (ast: any) => {
        if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
            return ast.value;
        }

        throw new Error(`Expected type Number, found {${ast.value}}`);
    }
});

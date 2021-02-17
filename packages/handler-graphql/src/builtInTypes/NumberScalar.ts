import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

const getNumber = (value: any): any => {
    if (typeof value !== "number") {
        return null;
    }

    return value;
};

export const Number = new GraphQLScalarType({
    name: "Number",
    description: "A custom input type to be used with numbers. Supports Int and Float.",
    serialize: (value: string | number) => {
        if (typeof value === "number") {
            return value;
        } else if (value === null || value === undefined || isNaN(value as any) === true) {
            return null;
        }
        return parseFloat(value);
    },
    parseValue: getNumber,
    parseLiteral: (ast: any) => {
        if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
            return ast.value;
        }

        throw new Error(`Expected type Number, found {${ast.value}}`);
    }
});

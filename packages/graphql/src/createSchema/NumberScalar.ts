import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

// TODO: Need to check whether user can send number as string
// And do we want to parse it in that case or use null
const getNumber = (value: any): any => {
    if (typeof value !== "number") {
        return null;
    }

    return value;
};

export const Number = new GraphQLScalarType({
    name: "Number",
    description: "A custom input type to be used with numbers. Supports Int and Float.",
    serialize: getNumber,
    parseValue: getNumber,
    parseLiteral: ast => {
        if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
            return ast.value;
        }

        throw new Error("Invalid Number value!");
    }
});

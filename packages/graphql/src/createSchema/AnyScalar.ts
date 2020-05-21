import { GraphQLScalarType } from "graphql";

const returnValue = (value: any): any => {
    return value;
};

export const Number = new GraphQLScalarType({
    name: "Any",
    description: `A scalar type that represents an ambiguous value.`,
    serialize: returnValue,
    parseValue: returnValue
});

import { GraphQLScalarType } from "graphql";
import { parseIdentifier } from "@webiny/utils";

export const RevisionIdScalar = new GraphQLScalarType({
    name: "RevisionId",
    description: "A Headless CMS Reference field input type.",
    parseValue: value => {
        if (!value) {
            return null;
        } else if (typeof value !== "string") {
            throw new Error("RevisionId value must be a string!");
        }

        const result = parseIdentifier(value);
        if (!result.version) {
            throw new Error(
                `RevisionId value must be a valid Revision ID property! Example: "abcdef#0001"`
            );
        }
        return value;
    }
});

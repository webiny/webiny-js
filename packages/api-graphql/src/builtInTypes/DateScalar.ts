import { DateResolver } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DateScalar = new GraphQLScalarType<Date | string, string>({
    ...DateResolver,
    parseValue: (value: unknown) => {
        if (typeof value !== "string" || !DATE_RE.test(value)) {
            throw new TypeError(
                `Date cannot represent an invalid date-string ${String(value)}. Expected format: YYYY-MM-DD.`
            );
        }
        return DateResolver.parseValue(value);
    },
    serialize: (value: any) => {
        if (!value) {
            return null;
        }
        try {
            const date = new Date(value);
            return date.toISOString().slice(0, 10);
        } catch (ex) {
            if (value.toISOString) {
                return value.toISOString().slice(0, 10);
            }
            throw ex;
        }
    }
});

import { DateTimeResolver } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";
export const DateTimeScalar = new GraphQLScalarType({
    ...DateTimeResolver,
    serialize: value => {
        if (!value) {
            return null;
        }
        try {
            const date = new Date(value);
            return date.toISOString();
        } catch (ex) {
            if (value.toISOString) {
                return value.toISOString();
            }
            throw ex;
        }
    }
});

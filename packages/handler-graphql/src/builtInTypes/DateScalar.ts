import { DateResolver } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";
export const DateScalar = new GraphQLScalarType({
    ...DateResolver,
    serialize: value => {
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

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
            return date.toISOString().substr(0, 10);
        } catch (ex) {
            if (value.toISOString) {
                return value.toISOString().substr(0, 10);
            }
            throw ex;
        }
    }
});

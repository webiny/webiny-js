import { DateResolver } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";
export const DateScalar = new GraphQLScalarType<Date | string, string>({
    ...DateResolver,
    /**
     * We can set value as any because we are handling it.
     */
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

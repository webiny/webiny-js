// @flow
import type { GraphQLObjectType } from "graphql/type";

export default (type: GraphQLObjectType) => {
    // Get fields from existing type
    const typeFields = {};
    const fields = type.getFields();
    Object.keys(fields).map(field => {
        const { type, resolve, args, description } = fields[field];
        typeFields[field] = {
            type,
            resolve,
            description,
            args: args.reduce((acc, arg) => {
                acc[arg.name] = arg;

                return acc;
            }, {})
        };
    });

    return typeFields;
};

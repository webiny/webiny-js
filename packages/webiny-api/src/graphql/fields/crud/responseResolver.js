import { GraphQLObjectType, GraphQLString } from "graphql";
import GraphQLJSON from "graphql-type-json";

const createErrorType = type => {
    return new GraphQLObjectType({
        name: type.name + "Error",
        fields: {
            message: { type: GraphQLString },
            code: { type: GraphQLString },
            data: { type: GraphQLJSON }
        }
    });
};

export const createResponseType = type => {
    return new GraphQLObjectType({
        name: type.name + "Response",
        fields: {
            data: { type },
            error: { type: createErrorType(type) }
        }
    });
};

export const responseResolver = resolver => {
    return async (...args) => {
        try {
            return { data: await resolver(...args) };
        } catch (err) {
            return {
                data: null,
                error: {
                    message: err.message,
                    code: err.code,
                    data: err.data
                }
            };
        }
    };
};

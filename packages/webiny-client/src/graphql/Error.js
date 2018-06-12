// @flow
import type { ApolloError } from "apollo-client";

class GraphQLError extends Error {
    code: string;
    data: ?Object;
    apolloError: Error;

    constructor(message: ?string, code: string, data: Object, apolloError: Error) {
        super(message);
        this.name = "GraphQLError";
        this.code = code;
        this.data = data;
        this.apolloError = apolloError;
    }

    static from(error: ApolloError) {
        const { message, code, data } = error.graphQLErrors[0];
        return new GraphQLError(message, code, data, error);
    }
}

export default GraphQLError;

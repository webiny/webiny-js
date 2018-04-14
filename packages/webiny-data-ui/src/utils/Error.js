// @flow
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
}

export default GraphQLError;

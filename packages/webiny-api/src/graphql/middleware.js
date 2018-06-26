// @flow
import { execute } from "graphql";
import { api } from "./../index";
import compose from "webiny-compose";
import httpError from "http-errors";
import getGraphQLParams from "./utils/getGraphQLParams";
import { authorization, authentication } from "./middleware/index.js";

/**
 * Main middleware for executing the requested graphql operation.
 * @returns {Function}
 */
const securityMiddleware = () => {
    return async (context, next) => {
        await authentication(context);
        await authorization(context);
        next();
    };
};

/**
 * Main middleware for executing the requested graphql operation.
 * @returns {Function}
 */
const graphqlMiddleware = () => {
    return async (context, next) => {
        if (!context.graphql.query) {
            throw httpError(400, "Must provide query string.");
        }

        context.output = await execute(
            api.graphql.getSchema(),
            context.graphql.documentAST,
            null,
            context,
            context.graphql.variables,
            context.graphql.operationName
        );

        next();
    };
};

const formatError = err => {
    return {
        message: err.message,
        code: err.originalError && err.originalError.code,
        data: err.originalError && err.originalError.data
    };
};

/**
 * Array of middleware constructed from graphql preparation, security middleware and graphql middleware.
 */
const middleware = [
    async (context, next) => {
        context.graphql = await getGraphQLParams(context.event);
        next();
    },
    securityMiddleware(),
    graphqlMiddleware(),
    (context, next, finish) => {
        if (context.output.errors) {
            context.output.errors = context.output.errors.map(formatError);
        }
        finish(context);
    }
];

export default compose(middleware);

// @flow
import { execute, parse } from "graphql";
import compose from "webiny-compose";
import { authorization, authentication } from "./middleware/index.js";
import schema from "./schema";

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
        context.output = await execute(
            schema.getGraphQLSchema(),
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
        context.graphql = {
            documentAST: parse(context.event.body.query),
            variables: context.event.body.variables,
            operationName: context.event.body.operationName
        };
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

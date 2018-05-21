// @flow
import { execute } from "graphql";
import { app } from "webiny-api";
import compose from "webiny-compose";
import httpError from "http-errors";
import getGraphQLParams from "./utils/getGraphQLParams";
import { authorization, authentication } from "./middleware/index.js";

const formatError = err => {
    console.error(err);
    return {
        message: err.message,
        code: err.originalError && err.originalError.code,
        data: err.originalError && err.originalError.data
    };
};

/**
 * Construct an array of middleware functions to prepare graphql request, process request and optionally send
 * the response if it isn't sent by any other middleware.
 *
 * @param {Function} middleware factory that returns an array of middleware functions.
 * @returns {Function} Final middleware function.
 */
export default (middleware: Function) => {
    /**
     * Main middleware for executing the requested graphql operation.
     * @returns {Function}
     */
    const graphqlMiddleware = () => {
        return async (params, next) => {
            if (!params.graphql.query) {
                throw httpError(400, "Must provide query string.");
            }

            params.output = await execute(
                app.graphql.getSchema(),
                params.graphql.documentAST,
                null,
                params.req,
                params.graphql.variables,
                params.graphql.operationName
            );

            next();
        };
    };

    /**
     * Main middleware for executing the requested graphql operation.
     * @returns {Function}
     */
    const securityMiddleware = () => {
        return async (params, next) => {
            await authentication(params);
            await authorization(params);
            next();
        };
    };

    /**
     * Array of middleware constructed from the main graphql middleware and any other project middleware defined by the developer.
     */
    middleware = middleware({ graphqlMiddleware, securityMiddleware }).filter(
        m => typeof m === "function"
    );

    /**
     * Additional middleware to parse graphql request which must always be first in the chain.
     */
    middleware.unshift(async (params, next) => {
        params.graphql = await getGraphQLParams(params.req);
        next();
    });

    /**
     * Additional middleware to optionally send the response which must always be the last one in the chain.
     */
    middleware.push((params, next, finish) => {
        if (params.output.errors) {
            params.output.errors = params.output.errors.map(formatError);
        }

        if (!params.res.finished) {
            params.res.json(params.output);
        }
        finish();
    });

    return compose(middleware);
};

// @flow
import expressGraphQL from "express-graphql";
import { app } from "webiny-api";

const formatError = err => {
    return {
        message: err.message,
        code: err.originalError && err.originalError.code,
        data: err.originalError && err.originalError.data
    };
};

export default (config: Object = {}) => {
    if (config.formatError) {
        const customFormat = config.formatError;
        config.formatError = err => {
            return customFormat(err, formatError);
        };
    } else {
        config.formatError = formatError;
    }

    let graphql;

    return (params: Object) => {
        if (!graphql) {
            config.schema = app.graphql.getSchema();
            graphql = expressGraphQL(config);
        }

        graphql(params.req, params.res);
    };
};

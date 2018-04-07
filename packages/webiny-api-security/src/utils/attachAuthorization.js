import debug from "debug";
const log = debug("webiny-api-security");
/**
 * Intercept `resolve` function and check if user is authorized to execute it
 */
export default app => {
    app.graphql.beforeSchema(schema => {
        Object.keys(schema.query).map(name => {
            const query = schema.query[name];
            const { resolve } = query;
            schema.query[name].resolve = (root, args, context, info) => {
                // TODO: run authorization checks
                log("Checking authorization for query %o", name);
                return resolve(root, args, context, info);
            };
        });

        Object.keys(schema.mutation).map(name => {
            const mutation = schema.mutation[name];
            const { resolve } = mutation;
            schema.mutation[name].resolve = (root, args, context, info) => {
                // TODO: run authorization checks
                log("Checking authorization for query %o", name);
                return resolve(root, args, context, info);
            };
        });
    });
};

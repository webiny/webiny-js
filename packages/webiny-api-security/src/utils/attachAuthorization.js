import debug from "debug";
const log = debug("webiny-api-security");
/**
 * Intercept `resolve` function and check if user is authorized to execute it
 */
export default app => {
    app.graphql.beforeSchema(schema => {
        ["query", "mutation"].map(operation => {
            Object.keys(schema[operation]).map(name => {
                const query = schema[operation][name];
                const { resolve } = query;
                schema[operation][name].resolve = (root, args, context, info) => {
                    // TODO: run authorization checks
                    log("Checking authorization for %s %o", operation, name);
                    const data = resolve(root, args, context, info);
                    // TODO: return only exposed fields
                    return data;
                };
            });
        });
    });
};

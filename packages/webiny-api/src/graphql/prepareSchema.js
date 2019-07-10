// @flow
const { buildFederatedSchema } = require("@apollo/federation");
import { getPlugins } from "webiny-plugins";

/**
 * @return {schema, context}
 */
export async function prepareSchema(config: Object) {
    // This allows developers to register more plugins dynamically, before the graphql schema is instantiated.
    const gqlPlugins = getPlugins("graphql-schema");
    for (let i = 0; i < gqlPlugins.length; i++) {
        if (typeof gqlPlugins[i].prepare === "function") {
            await gqlPlugins[i].prepare(config);
        }
    }

    const schemaDefs = [];
    const schemaPlugins = getPlugins("graphql-schema");
    for (let i = 0; i < schemaPlugins.length; i++) {
        const { schema } = schemaPlugins[i];
        if (!schema) {
            continue;
        }

        if (typeof schema === "function") {
            schemaDefs.push(await schema(config));
        } else {
            schemaDefs.push(schema);
        }
    }

    return buildFederatedSchema([...schemaDefs]);
}
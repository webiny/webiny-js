import { CreateApolloHandlerPlugin } from "../types";
import { CreateSchemaPlugin } from "@webiny/handler-apollo-server/types";
import { runHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { Headers } from "apollo-server-env";
import buildCorsHeaders from "./../buildCorsHeaders";

let cache;

const plugin: CreateApolloHandlerPlugin = {
    name: "handler-apollo-server-create-handler",
    type: "handler-apollo-server-create-handler",
    async create({ context, options }) {
        if (cache) {
            return cache;
        }

        const createSchemaPlugin = context.plugins.byName<CreateSchemaPlugin>(
            "handler-apollo-server-create-schema"
        );

        if (!createSchemaPlugin) {
            throw Error(`"handler-apollo-server-create-schema" plugin is not configured!`);
        }

        const { schema } = await createSchemaPlugin.create(context);
        const schemaHash = generateSchemaHash(schema);

        const { http } = context;
        try {
            cache = {
                schema,
                handler: async function(query, context) {
                    const { graphqlResponse } = await runHttpQuery([], {
                        method: "POST",
                        query,
                        options: { schema, schemaHash, context },
                        request: {
                            url: "/graphql",
                            method: "POST",
                            headers: new Headers(http.headers)
                        }
                    });

                    return http.response({
                        body: graphqlResponse,
                        headers: buildCorsHeaders({
                            "Content-Type": "application/json"
                        })
                    });
                }
            };
        } catch (e) {
            return http.response({
                body: e,
                headers: buildCorsHeaders({
                    "Content-Type": "application/json"
                })
            });
        }

        return cache;
    }
};

export default plugin;

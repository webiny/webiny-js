import { CreateSchemaPlugin } from "@webiny/handler-apollo-server/types";
import { get } from "lodash";
import { HandlerContext } from "@webiny/handler/types";
import { runHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { Headers } from "apollo-server-env";
import buildCorsHeaders from "./buildCorsHeaders";

type CreateApolloHandlerParams = {
    context: HandlerContext;
    options: { [key: string]: any };
    meta?: { [key: string]: any };
};

export default async function createApolloHandler({
    context,
    meta = null
}: CreateApolloHandlerParams) {
    const createSchemaPlugin = context.plugins.byName<CreateSchemaPlugin>(
        "handler-apollo-server-create-schema"
    );

    if (!createSchemaPlugin) {
        throw Error(`"handler-apollo-server-create-schema" plugin is not configured!`);
    }

    const { http } = context;

    const { schema } = await createSchemaPlugin.create(context);
    const schemaHash = generateSchemaHash(schema);

    const output = {
        meta,
        async queryMeta() {
            // Invoke handler and check if environment / environment alias has changed.
            const response = await output.handler(
                {
                    query: /* GraphQL */ `
                        {
                            getMeta {
                                cacheKey
                            }
                        }
                    `
                },
                context
            );

            const body = JSON.parse(response.body);
            return get(body, "data.getMeta") || {};
        },
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

    if (!output.meta) {
        output.meta = await output.queryMeta();
    }

    return output;
}

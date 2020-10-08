import { CreateApolloHandlerPlugin } from "../types";
import { CreateSchemaPlugin } from "@webiny/handler-apollo-server/types";
import { runHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { Headers } from "apollo-server-env";

let cache;

const plugin: CreateApolloHandlerPlugin = {
    name: "handler-apollo-server-create-handler",
    type: "handler-apollo-server-create-handler",
    async create({ context }) {
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

        cache = {
            schema,
            handler: (query, context) =>
                runHttpQuery([], {
                    method: "POST",
                    query,
                    options: { schema, schemaHash, context },
                    request: {
                        url: context.http.path.base,
                        method: context.http.method,
                        headers: new Headers(context.http.headers)
                    }
                })
        };

        return cache;
    }
};

export default plugin;

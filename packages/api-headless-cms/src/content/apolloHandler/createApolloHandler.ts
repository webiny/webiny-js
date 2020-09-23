import { CreateSchemaPlugin } from "@webiny/handler-apollo-server/types";
import { HandlerContext } from "@webiny/handler/types";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { runHttpQuery as apolloRunHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { Headers } from "apollo-server-env";

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

    const { schema } = await createSchemaPlugin.create(context);
    const schemaHash = generateSchemaHash(schema);

    const runHttpQuery = (query, context) => {
        return apolloRunHttpQuery([], {
            method: "POST",
            query,
            options: { schema, schemaHash, context },
            request: {
                url: "/graphql",
                method: "POST",
                headers: new Headers()
            }
        });
    };

    const output = {
        meta,
        schema,
        handler: runHttpQuery,
        async queryMeta() {
            // Invoke handler and check if environment / environment alias has changed.
            const { graphqlResponse } = await runHttpQuery(
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

            return JSON.parse(graphqlResponse)?.data?.getMeta;
        }
    };

    if (!output.meta) {
        output.meta = await output.queryMeta();
    }

    return output;
}

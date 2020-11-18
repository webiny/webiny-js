// @ts-nocheck
// TODO: 2020-11-15, @adrian
// TODO: complete build from scratch - we no longer have these plugins, it's should be coded much simpler.
// TODO: Check code of `handler-graphql` to get a sense how it should look. The only difference will be
// TODO: in how we cache handlers - here we must cache per type, tenant, environment, and content locale.
import { CreateSchemaPlugin } from "@webiny/handler-graphql/types";
import { Context } from "@webiny/handler/types";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { runHttpQuery as apolloRunHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { Headers } from "apollo-server-env";

type CreateApolloHandlerParams = {
    context: Context;
    options: { [key: string]: any };
    meta?: { [key: string]: any };
};

export default async function createApolloHandler({
    context,
    meta = null
}: CreateApolloHandlerParams) {
    const createSchemaPlugin = context.plugins.byName<CreateSchemaPlugin>(
        "handler-graphql-create-schema"
    );

    if (!createSchemaPlugin) {
        throw Error(`"handler-graphql-create-schema" plugin is not configured!`);
    }

    const { schema } = await createSchemaPlugin.create(context);
    const schemaHash = generateSchemaHash(schema);

    const runHttpQuery = (query, context) => {
        return apolloRunHttpQuery([], {
            method: "POST",
            query,
            options: { schema, schemaHash, context },
            request: {
                url: context.http.path.base,
                method: context.http.method,
                headers: new Headers(context.http.headers)
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

import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLEngineFeature } from "~/engine/index.js";
import type { PluginCollection } from "@webiny/plugins/types";

interface Params {
    plugins?: PluginCollection;
}

export default ({ plugins = [] }: Params = {}) => {
    const handler = createTestHttpHandler({
        root: () => {},
        request: async container => {
            // DI-native plugins are plain `container => {}` functions (they register features /
            // request-context initializers directly). Call them here.
            for (const plugin of [plugins].flat(Infinity as 1).filter(Boolean)) {
                (plugin as (container: any) => void)(container);
            }

            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ method = "POST", body = {}, headers = {}, ...rest }: any) => {
        const response = await handler({
            method,
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                ...headers
            },
            body,
            ...rest
        });
        return [response.body, response];
    };

    return {
        handler,
        invoke,
        async introspect() {
            return invoke({ body: { query: INTROSPECTION } });
        }
    };
};

const INTROSPECTION = /* GraphQL */ `
    {
        __schema {
            types {
                name
                fields {
                    name
                    type {
                        name
                        kind
                        ofType {
                            name
                            kind
                        }
                    }
                }
            }
        }
    }
`;

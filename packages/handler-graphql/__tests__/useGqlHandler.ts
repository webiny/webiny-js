import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLEngineFeature } from "~/engine/index.js";
import { registerLegacyPluginsViaGqlContextualSchema } from "~/registerLegacyPluginsViaGqlContextualSchema.js";
import type { PluginCollection } from "@webiny/plugins/types";

interface Params {
    plugins?: PluginCollection;
}

export default ({ plugins = [] }: Params = {}) => {
    const handler = createTestHttpHandler({
        root: () => {},
        request: async container => {
            const flat = [plugins].flat(Infinity as 1).filter(Boolean);
            // DI-native plugins are plain `container => {}` functions (they register features /
            // request-context initializers directly). Call them here; everything else (legacy
            // `graphql-schema` plugins) still goes through the bridge until #39 removes it.
            const isFn = (p: any) => typeof p === "function" && !p.prototype;
            for (const plugin of flat.filter(isFn)) {
                (plugin as (container: any) => void)(container);
            }
            registerLegacyPluginsViaGqlContextualSchema(
                container,
                flat.filter(p => !isFn(p))
            );

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

import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLContextEnhancer, GraphQLEngineFeature } from "~/engine/index.js";
import { registerLegacyPluginsViaGqlContextEnhancer } from "~/registerLegacyPluginsViaGqlContextEnhancer.js";
import { interceptConsole } from "~/interceptConsole.js";
import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";

interface Params {
    debug?: boolean;
    plugins?: PluginCollection;
}

export default ({ debug = false, plugins = [] }: Params = {}) => {
    const handler = createTestHttpHandler({
        root: () => {},
        request: async container => {
            container.registerInstance(GraphQLContextEnhancer, {
                enhance(ctx: Record<string, any>) {
                    ctx.plugins = new PluginsContainer([]);
                }
            });

            const flat = [plugins].flat(Infinity as 1).filter(Boolean);
            if (flat.length > 0) {
                registerLegacyPluginsViaGqlContextEnhancer(container, flat);
            }

            if (debug) {
                container.registerInstance(GraphQLContextEnhancer, {
                    enhance(ctx: Record<string, any>) {
                        ctx.debug = { logs: [] };
                        interceptConsole((method: string, args: any[]) => {
                            ctx.debug.logs.push({ method, args });
                        });
                    }
                });
                container.registerInstance(GraphQLContextEnhancer, {
                    enhance(ctx: Record<string, any>) {
                        ctx.plugins.register({
                            type: "graphql-after-query",
                            apply({ result, context }: any) {
                                result["extensions"] = {
                                    console: [...(context.debug.logs || [])]
                                };
                                if (context.debug.logs) {
                                    context.debug.logs.length = 0;
                                }
                            }
                        });
                    }
                });
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

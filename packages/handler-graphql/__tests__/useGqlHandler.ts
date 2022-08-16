import { createHandler } from "@webiny/handler-aws/gateway";
import graphqlServerPlugins from "../src";
import { PluginCollection } from "@webiny/plugins/types";

interface Params {
    debug?: boolean;
    plugins?: PluginCollection;
}

export default ({ debug = false, plugins = [] }: Params = {}) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [graphqlServerPlugins({ debug }), ...plugins]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ method = "POST", body = {}, headers = {}, ...rest }) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod: method,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as any,
            {} as any
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
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

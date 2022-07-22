import { createHandler } from "@webiny/handler";
import handlerArgsPlugins from "@webiny/handler-args";
import handlerHTTPPlugins from "@webiny/handler-http";
import graphqlServerPlugins from "../src";

export default ({ debug = false, plugins = [] } = {}) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            handlerArgsPlugins(),
            handlerHTTPPlugins(),
            graphqlServerPlugins({ debug }),
            ...plugins
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ method = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            method,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

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

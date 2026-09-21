import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { GraphQLEngineFeature } from "~/engine/index.js";
import type { Container } from "@webiny/di";

interface Params {
    setup?: Array<(container: Container) => void>;
}

export default ({ setup = [] }: Params = {}) => {
    const handler = createTestHttpHandler({
        root: () => {},
        child: async container => {
            // DI-native setup callbacks are plain `container => {}` functions (they register features /
            // request-context initializers / schema factories directly).
            for (const cb of [setup].flat(Infinity as 1).filter(Boolean)) {
                (cb as (container: Container) => void)(container);
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

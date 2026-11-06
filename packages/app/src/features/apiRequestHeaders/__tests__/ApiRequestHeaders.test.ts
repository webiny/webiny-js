import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLClient } from "~/features/graphqlClient/abstractions.js";
import { ApiStreamClient } from "~/features/apiStreamClient/abstractions.js";
import { ApiRequestHeaders } from "../abstractions.js";
import { ApiRequestHeadersFeature } from "../feature.js";

// The clients as the root container has them: singletons, with an outer decorator that sets the tenant.
function createContainer() {
    const container = new Container();
    const graphql = vi.fn(async (_params: GraphQLClient.Request) => ({}));
    const stream = vi.fn(async (_params: ApiStreamClient.Request) => new Response());
    class FetchGraphQL implements GraphQLClient.Interface {
        execute(params: GraphQLClient.Request) {
            return graphql(params) as any;
        }
    }
    class FetchStream implements ApiStreamClient.Interface {
        execute(params: ApiStreamClient.Request) {
            return stream(params) as any;
        }
    }
    container
        .register(
            GraphQLClient.createImplementation({
                implementation: FetchGraphQL,
                dependencies: []
            })
        )
        .inSingletonScope();
    container
        .register(
            ApiStreamClient.createImplementation({
                implementation: FetchStream,
                dependencies: []
            })
        )
        .inSingletonScope();
    ApiRequestHeadersFeature.register(container);

    class WithTenant implements GraphQLClient.Interface {
        constructor(private decoratee: GraphQLClient.Interface) {}
        execute(params: GraphQLClient.Request) {
            return this.decoratee.execute({
                ...params,
                headers: { ...params.headers, "x-tenant": "root" }
            });
        }
    }
    container.registerDecorator(
        GraphQLClient.createDecorator({ decorator: WithTenant, dependencies: [] })
    );
    return { container, graphql, stream };
}

const sentHeaders = (mock: ReturnType<typeof vi.fn>) =>
    (mock.mock.calls.at(-1) as any[])[0].headers;

describe("ApiRequestHeaders", () => {
    it("adds a provider registered after the clients were built, on the next request", async () => {
        const { container, graphql, stream } = createContainer();
        const client = container.resolve(GraphQLClient);
        const streamClient = container.resolve(ApiStreamClient);
        // Built once and cached, as at the admin's boot.
        expect(container.resolve(GraphQLClient)).toBe(client);

        await client.execute({ endpoint: "/graphql", query: "{ a }" });
        expect(sentHeaders(graphql)).toEqual({ "x-tenant": "root" });

        container.registerInstance(ApiRequestHeaders, {
            getHeaders: async () => ({ "x-site": "a" })
        });

        await client.execute({ endpoint: "/graphql", query: "{ a }" });
        await streamClient.execute({ path: "/stream/x" });
        expect(sentHeaders(graphql)).toEqual({ "x-site": "a", "x-tenant": "root" });
        expect(sentHeaders(stream)).toEqual({ "x-site": "a" });
    });

    it("reads a provider on every request", async () => {
        const { container, graphql } = createContainer();
        let site: string | undefined = "a";
        container.registerInstance(ApiRequestHeaders, {
            getHeaders: () => (site ? { "x-site": site } : {})
        });
        const client = container.resolve(GraphQLClient);

        await client.execute({ endpoint: "/graphql", query: "{ a }" });
        expect(sentHeaders(graphql)["x-site"]).toBe("a");

        site = undefined;
        await client.execute({ endpoint: "/graphql", query: "{ a }" });
        expect(sentHeaders(graphql)).not.toHaveProperty("x-site");
    });

    it("doesn't let a provider's undefined value overwrite another provider's header", async () => {
        const { container, graphql, stream } = createContainer();
        container.registerInstance(ApiRequestHeaders, {
            getHeaders: () => ({ "x-site": "a" })
        });
        container.registerInstance(ApiRequestHeaders, {
            getHeaders: () => ({ "x-site": undefined })
        });

        await container.resolve(GraphQLClient).execute({ endpoint: "/graphql", query: "{ a }" });
        await container.resolve(ApiStreamClient).execute({ path: "/stream/x" });

        expect(sentHeaders(graphql)["x-site"]).toBe("a");
        expect(sentHeaders(stream)["x-site"]).toBe("a");
    });

    it("lets the request's own and the outer decorators' headers win", async () => {
        const { container, graphql } = createContainer();
        container.registerInstance(ApiRequestHeaders, {
            getHeaders: () => ({ "x-tenant": "other", "x-request": "provider" })
        });

        await container.resolve(GraphQLClient).execute({
            endpoint: "/graphql",
            query: "{ a }",
            headers: { "x-request": "own" }
        });

        expect(sentHeaders(graphql)).toEqual({
            "x-tenant": "root",
            "x-request": "own"
        });
    });
});

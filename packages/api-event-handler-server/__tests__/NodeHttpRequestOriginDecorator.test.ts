import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { RequestOrigin as RequestOriginImpl } from "@webiny/api-core/features/requestContext/RequestOrigin.js";
import { RequestOrigin } from "@webiny/api-core/features/requestContext/index.js";
import { NodeHttpEventHandler } from "@webiny/event-handler-server";
import { NodeHttpRequestOriginDecorator } from "~/handlers/NodeHttpRequestOriginDecorator.js";

function setup() {
    const container = new Container();
    container.register(RequestOriginImpl).inSingletonScope();

    let innerCalled = false;
    container.registerInstance(NodeHttpEventHandler, {
        async execute() {
            innerCalled = true;
            return "inner-ok";
        }
    });
    container.registerDecorator(NodeHttpRequestOriginDecorator);

    return {
        handler: container.resolve(NodeHttpEventHandler),
        origin: () => container.resolve(RequestOrigin).get(),
        innerCalled: () => innerCalled,
        run: (headers: Record<string, string>) =>
            container
                .resolve(NodeHttpEventHandler)
                .execute({ event: { headers }, metadata: {} } as any, async () => undefined)
    };
}

describe("NodeHttpRequestOriginDecorator", () => {
    it("rebuilds the origin the dev proxy forwarded, prefix included", async () => {
        const t = setup();

        await t.run({
            host: "127.0.0.1:41000",
            "x-forwarded-host": "localhost:3001",
            "x-forwarded-proto": "http",
            "x-forwarded-prefix": "/api"
        });

        // Not the api's own address: `host` here is the private port the proxy dialled, which no
        // client can reach.
        expect(t.origin()).toBe("http://localhost:3001/api");
    });

    it("handles a portless-style https domain", async () => {
        const t = setup();

        await t.run({
            "x-forwarded-host": "wby6.localhost",
            "x-forwarded-proto": "https",
            "x-forwarded-prefix": "/api"
        });

        expect(t.origin()).toBe("https://wby6.localhost/api");
    });

    it("falls back to the Host header when nothing is forwarding", async () => {
        const t = setup();

        await t.run({ host: "api.example.com" });

        expect(t.origin()).toBe("http://api.example.com");
    });

    it("leaves the origin unset when there is no host at all", async () => {
        const t = setup();

        await t.run({});

        // Callers then use the configured <Infra.ApiUrl>, or fail loudly if there isn't one.
        expect(t.origin()).toBeNull();
    });

    it("runs the inner handler and passes its result through", async () => {
        const t = setup();

        const result = await t.run({ host: "api.example.com" });

        expect(t.innerCalled()).toBe(true);
        expect(result).toBe("inner-ok");
    });
});

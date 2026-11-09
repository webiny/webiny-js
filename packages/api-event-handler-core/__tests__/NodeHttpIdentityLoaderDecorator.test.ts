import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { NodeHttpIdentityLoaderDecorator } from "~/nodeHttp/NodeHttpIdentityLoaderDecorator.js";

function setup() {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();

    let establishCalled = false;
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            establishCalled = true;
        }
    });

    let innerCalled = false;
    container.registerInstance(NodeHttpEventHandler, {
        async execute() {
            innerCalled = true;
            return { statusCode: 200, headers: {}, body: "" };
        }
    });
    container.registerDecorator(NodeHttpIdentityLoaderDecorator);

    const handler = container.resolve(NodeHttpEventHandler);

    return {
        run: async (headers: Record<string, string>) => {
            const event = { headers } as any;
            await handler.execute({ event, metadata: {} } as any, async () => undefined);
        },
        token: () => container.resolve(RawAuthToken).get(),
        establishCalled: () => establishCalled,
        innerCalled: () => innerCalled
    };
}

describe("NodeHttpIdentityLoaderDecorator", () => {
    it("prefers x-webiny-authorization over Authorization", async () => {
        const t = setup();
        await t.run({
            "x-webiny-authorization": "Bearer from-webiny-header",
            authorization: "Bearer from-authorization"
        });

        expect(t.token()).toBe("from-webiny-header");
        expect(t.establishCalled()).toBe(true);
        expect(t.innerCalled()).toBe(true);
    });

    it("reads the wby-id-token cookie when there is no auth header", async () => {
        const t = setup();
        await t.run({ cookie: "theme=dark; wby-id-token=abc%2Edef" });

        expect(t.token()).toBe("abc.def");
    });

    it("ignores another cookie that is not valid URI encoding", async () => {
        const t = setup();
        await t.run({ cookie: "promo=50%off; wby-id-token=abc" });

        expect(t.token()).toBe("abc");
        expect(t.innerCalled()).toBe(true);
    });

    it("treats a wby-id-token that is not valid URI encoding as no token", async () => {
        const t = setup();
        await t.run({ cookie: "wby-id-token=50%off" });

        expect(t.token()).toBeNull();
        expect(t.innerCalled()).toBe(true);
    });

    it("sets no token when there is no header and no cookie", async () => {
        const t = setup();
        await t.run({});

        expect(t.token()).toBeNull();
        expect(t.establishCalled()).toBe(true);
    });
});

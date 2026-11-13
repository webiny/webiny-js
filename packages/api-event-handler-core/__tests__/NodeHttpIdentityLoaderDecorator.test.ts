import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { NodeHttpEventHandler } from "@webiny/event-handler-core/nodeHttp/index.js";
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
    // Header precedence and cookie decoding are `extractAuthToken`'s; see its tests. These check
    // that the decorator hands the token on and lets the request through.
    it("puts the token from a header into RawAuthToken, loads identity, then runs the handler", async () => {
        const t = setup();
        await t.run({ authorization: "Bearer from-authorization" });

        expect(t.token()).toBe("from-authorization");
        expect(t.establishCalled()).toBe(true);
        expect(t.innerCalled()).toBe(true);
    });

    it("puts the token from the wby-id-token cookie into RawAuthToken", async () => {
        const t = setup();
        await t.run({ cookie: "theme=dark; wby-id-token=abc" });

        expect(t.token()).toBe("abc");
        expect(t.innerCalled()).toBe(true);
    });
});

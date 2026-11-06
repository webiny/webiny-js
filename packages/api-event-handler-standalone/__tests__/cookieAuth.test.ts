import { describe, it, expect } from "vitest";
import type { IncomingMessage } from "node:http";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";

/*
 * The API authenticates with headers only. A `wby-id-token` cookie must never authenticate a request:
 * browsers attach cookies to cross-site requests, so honouring one would enable CSRF.
 */

async function extractToken(headers: Record<string, string>): Promise<string | null> {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            return undefined;
        }
    });
    container.registerInstance(NodeHttpEventHandler, {
        async execute() {
            return { statusCode: 200 };
        }
    });
    container.registerDecorator(NodeHttpIdentityLoaderDecorator);

    const handler = container.resolve(NodeHttpEventHandler);
    const event = { headers } as unknown as IncomingMessage;
    await handler.execute({ event, metadata: {} } as any, async () => undefined);

    return container.resolve(RawAuthToken).get();
}

describe("NodeHttpIdentityLoaderDecorator cookie authentication", () => {
    it("treats a request carrying only the wby-id-token cookie as anonymous", async () => {
        await expect(extractToken({ cookie: "wby-id-token=abc" })).resolves.toBeNull();
        await expect(extractToken({ cookie: "other=1; wby-id-token=abc" })).resolves.toBeNull();
    });

    it("still reads the token from the headers", async () => {
        await expect(
            extractToken({ authorization: "Bearer abc", cookie: "wby-id-token=x" })
        ).resolves.toBe("abc");
        await expect(extractToken({ "x-webiny-authorization": "Bearer def" })).resolves.toBe("def");
    });
});

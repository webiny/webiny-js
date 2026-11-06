import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { FunctionUrlStreamIdentityLoaderDecorator } from "~/handlers/FunctionUrlStreamIdentityLoaderDecorator.js";
import { extractAuthToken } from "~/handlers/extractRequestAuth.js";
import { headersFromFunctionUrlEvent } from "~/handlers/extractRequestAuth.js";

/*
 * The API authenticates with headers only. A `wby-id-token` cookie must never authenticate a request:
 * browsers attach cookies to cross-site requests, so honouring one would enable CSRF.
 */

function createContainer(): Container {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            return undefined;
        }
    });
    return container;
}

describe("cookie authentication", () => {
    it("extractAuthToken ignores the wby-id-token cookie", () => {
        expect(extractAuthToken({ cookie: "wby-id-token=abc" })).toBeNull();
        expect(extractAuthToken({ Cookie: "other=1; wby-id-token=abc" })).toBeNull();
    });

    it("extractAuthToken still reads the headers", () => {
        expect(extractAuthToken({ authorization: "Bearer abc", cookie: "wby-id-token=x" })).toBe(
            "abc"
        );
        expect(extractAuthToken({ "x-webiny-authorization": "Bearer def" })).toBe("def");
    });

    it("headersFromFunctionUrlEvent does not fold the cookies array into a cookie header", () => {
        const headers = headersFromFunctionUrlEvent({
            headers: { "x-tenant": "root" },
            cookies: ["wby-id-token=abc"]
        });

        expect(headers).toEqual({ "x-tenant": "root" });
    });

    it("an API Gateway request carrying only the cookie is anonymous", async () => {
        const container = createContainer();
        container.registerInstance(ApiGatewayEventHandler, {
            async execute() {
                return { statusCode: 200, body: "" };
            }
        });
        container.registerDecorator(ApiGatewayIdentityLoaderDecorator);

        const handler = container.resolve(ApiGatewayEventHandler);
        const event = { headers: { cookie: "wby-id-token=abc" } };
        await handler.execute({ event, metadata: {} } as any, async () => undefined);

        expect(container.resolve(RawAuthToken).get()).toBeNull();
    });

    it("a Function URL request carrying only the cookie is anonymous", async () => {
        const container = createContainer();
        container.registerInstance(FunctionUrlStreamEventHandler, {
            async execute() {
                return undefined;
            }
        });
        container.registerDecorator(FunctionUrlStreamIdentityLoaderDecorator);

        const handler = container.resolve(FunctionUrlStreamEventHandler);
        const event = { headers: {}, cookies: ["wby-id-token=abc"] };
        await handler.execute({ event, metadata: {} } as any, async () => undefined);

        expect(container.resolve(RawAuthToken).get()).toBeNull();
    });
});

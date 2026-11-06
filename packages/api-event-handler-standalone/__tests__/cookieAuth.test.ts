import { describe, it, expect } from "vitest";
import type { IncomingMessage } from "node:http";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";

/*
 * The `wby-id-token` cookie authenticates only GET/HEAD requests under `/private/` (private file
 * delivery: an `<img src>` cannot send an `Authorization` header). Anywhere else a cookie must not
 * authenticate: browsers attach it to cross-site requests, so honouring it would enable CSRF.
 *
 * A request authenticated by a header token gets the cookie set on its response.
 */

const VALID_TOKEN = "valid-token";

interface IStubIdentity {
    isAnonymous(): boolean;
}

interface IRequestParams {
    method: string;
    url: string;
    headers: Record<string, string>;
}

interface IInvokeResult {
    token: string | null;
    response: IHttpResponse;
}

async function invoke(params: IRequestParams): Promise<IInvokeResult> {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();

    let identity: IStubIdentity = { isAnonymous: () => true };
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            const anonymous = container.resolve(RawAuthToken).get() !== VALID_TOKEN;
            identity = { isAnonymous: () => anonymous };
        }
    });
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity
    } as unknown as IdentityContext.Interface);
    container.registerInstance(NodeHttpEventHandler, {
        async execute() {
            return { statusCode: 200 };
        }
    });
    container.registerDecorator(NodeHttpIdentityLoaderDecorator);

    const handler = container.resolve(NodeHttpEventHandler);
    const event = params as unknown as IncomingMessage;
    const response = await handler.execute({ event, metadata: {} } as any, async () => undefined);

    return { token: container.resolve(RawAuthToken).get(), response };
}

const cookie = `wby-id-token=${VALID_TOKEN}`;

describe("NodeHttpIdentityLoaderDecorator cookie authentication", () => {
    it("ignores the cookie on POST /graphql", async () => {
        const { token } = await invoke({ method: "POST", url: "/graphql", headers: { cookie } });
        expect(token).toBeNull();
    });

    it("ignores the cookie on GET /graphql", async () => {
        const { token } = await invoke({ method: "GET", url: "/graphql", headers: { cookie } });
        expect(token).toBeNull();
    });

    it("authenticates GET and HEAD /private/* with the cookie", async () => {
        for (const method of ["GET", "HEAD"]) {
            const { token } = await invoke({
                method,
                url: "/private/x?width=100",
                headers: { cookie: `other=1; ${cookie}` }
            });
            expect(token).toBe(VALID_TOKEN);
        }
    });

    it("ignores the cookie on POST /private/*", async () => {
        const { token } = await invoke({ method: "POST", url: "/private/x", headers: { cookie } });
        expect(token).toBeNull();
    });

    it("ignores the cookie on a path that only starts with /private", async () => {
        const { token } = await invoke({ method: "GET", url: "/privateX/x", headers: { cookie } });
        expect(token).toBeNull();
    });

    it("ignores a malformed cookie value", async () => {
        const { token } = await invoke({
            method: "GET",
            url: "/private/x",
            headers: { cookie: "wby-id-token=%E0%A4%A" }
        });
        expect(token).toBeNull();
    });

    it("prefers a header token over the cookie", async () => {
        const { token } = await invoke({
            method: "GET",
            url: "/private/x",
            headers: { authorization: "Bearer abc", cookie }
        });
        expect(token).toBe("abc");

        const webiny = await invoke({
            method: "GET",
            url: "/private/x",
            headers: { "x-webiny-authorization": "Bearer def", cookie }
        });
        expect(webiny.token).toBe("def");
    });
});

describe("NodeHttpIdentityLoaderDecorator id token cookie", () => {
    it("sets the cookie on a header-authenticated response", async () => {
        const { response } = await invoke({
            method: "POST",
            url: "/graphql",
            headers: { authorization: `Bearer ${VALID_TOKEN}` }
        });

        expect(response.cookies).toHaveLength(1);
        expect(response.cookies![0]).toMatch(
            /^wby-id-token=valid-token; Path=\/; Expires=[^;]+; HttpOnly; Secure; SameSite=None$/
        );
        expect(response.headers?.["cache-control"]).toBe(`no-cache="Set-Cookie"`);
    });

    it("does not set the cookie on an anonymous response", async () => {
        const { response } = await invoke({
            method: "POST",
            url: "/graphql",
            headers: { authorization: "Bearer invalid-token" }
        });
        expect(response.cookies).toBeUndefined();
    });

    it("does not set the cookie on a cookie-authenticated response", async () => {
        const { token, response } = await invoke({
            method: "GET",
            url: "/private/x",
            headers: { cookie }
        });
        expect(token).toBe(VALID_TOKEN);
        expect(response.cookies).toBeUndefined();
    });
});

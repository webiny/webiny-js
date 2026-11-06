import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import type { ApiGatewayResult } from "@webiny/event-handler-aws";
import { ApiGatewayIdentityLoaderDecorator } from "~/handlers/ApiGatewayIdentityLoaderDecorator.js";
import { FunctionUrlStreamIdentityLoaderDecorator } from "~/handlers/FunctionUrlStreamIdentityLoaderDecorator.js";

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

interface IInvokeResult {
    token: string | null;
    result: ApiGatewayResult;
}

interface IApiGatewayEventParams {
    method: string;
    path: string;
    headers?: Record<string, string>;
    stage?: string;
}

function createContainer(validToken: string = VALID_TOKEN): Container {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();

    let identity: IStubIdentity = { isAnonymous: () => true };
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            const token = container.resolve(RawAuthToken).get();
            const anonymous = token !== validToken;
            identity = { isAnonymous: () => anonymous };
        }
    });
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity
    } as unknown as IdentityContext.Interface);
    return container;
}

function v1Event(params: IApiGatewayEventParams): Record<string, unknown> {
    const stage = params.stage;
    return {
        httpMethod: params.method,
        path: stage ? `/${stage}${params.path}` : params.path,
        headers: params.headers ?? {},
        requestContext: stage ? { stage } : {}
    };
}

async function invokeApiGateway(
    event: Record<string, unknown>,
    response: ApiGatewayResult = { statusCode: 200, body: "" },
    validToken: string = VALID_TOKEN
): Promise<IInvokeResult> {
    const container = createContainer(validToken);
    container.registerInstance(ApiGatewayEventHandler, {
        async execute() {
            return response;
        }
    });
    container.registerDecorator(ApiGatewayIdentityLoaderDecorator);

    const handler = container.resolve(ApiGatewayEventHandler);
    const result = (await handler.execute(
        { event, metadata: {} } as any,
        async () => undefined
    )) as ApiGatewayResult;

    return { token: container.resolve(RawAuthToken).get(), result };
}

const cookie = `wby-id-token=${VALID_TOKEN}`;

describe("API Gateway cookie authentication", () => {
    it("ignores the cookie on POST /graphql", async () => {
        const { token } = await invokeApiGateway(
            v1Event({ method: "POST", path: "/graphql", headers: { cookie } })
        );
        expect(token).toBeNull();
    });

    it("ignores the cookie on GET /graphql", async () => {
        const { token } = await invokeApiGateway(
            v1Event({ method: "GET", path: "/graphql", headers: { cookie } })
        );
        expect(token).toBeNull();
    });

    it("authenticates GET and HEAD /private/* with the cookie", async () => {
        for (const method of ["GET", "HEAD"]) {
            const { token } = await invokeApiGateway(
                v1Event({ method, path: "/private/x", headers: { cookie: `other=1; ${cookie}` } })
            );
            expect(token).toBe(VALID_TOKEN);
        }
    });

    it("ignores the cookie on POST /private/*", async () => {
        const { token } = await invokeApiGateway(
            v1Event({ method: "POST", path: "/private/x", headers: { cookie } })
        );
        expect(token).toBeNull();
    });

    it("authenticates a stage-prefixed /private/* path with the cookie", async () => {
        const { token } = await invokeApiGateway(
            v1Event({ method: "GET", path: "/private/x", stage: "prod", headers: { cookie } })
        );
        expect(token).toBe(VALID_TOKEN);
    });

    it("authenticates a payload format 2.0 /private/* request with the cookies array", async () => {
        const { token } = await invokeApiGateway({
            rawPath: "/prod/private/x",
            headers: {},
            cookies: [cookie],
            requestContext: { stage: "prod", http: { method: "GET" } }
        });
        expect(token).toBe(VALID_TOKEN);
    });

    it("ignores the cookie on a path that only starts with /private", async () => {
        const { token } = await invokeApiGateway(
            v1Event({ method: "GET", path: "/privateX/x", headers: { cookie } })
        );
        expect(token).toBeNull();
    });

    it("ignores a malformed cookie value", async () => {
        const { token } = await invokeApiGateway(
            v1Event({
                method: "GET",
                path: "/private/x",
                headers: { cookie: "wby-id-token=%E0%A4%A" }
            })
        );
        expect(token).toBeNull();
    });

    it("prefers a header token over the cookie", async () => {
        const { token } = await invokeApiGateway(
            v1Event({
                method: "GET",
                path: "/private/x",
                headers: { authorization: "Bearer header-token", cookie }
            })
        );
        expect(token).toBe("header-token");
    });
});

describe("API Gateway id token cookie", () => {
    it("sets the cookie on a header-authenticated response", async () => {
        const exp = Math.floor(Date.UTC(2030, 0, 1) / 1000);
        const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
        const jwt = `header.${payload}.signature`;

        const { result } = await invokeApiGateway(
            v1Event({
                method: "POST",
                path: "/graphql",
                headers: { authorization: `Bearer ${jwt}` }
            }),
            {
                statusCode: 200,
                body: "",
                headers: { "cache-control": "no-store" },
                cookies: ["a=1; Path=/"],
                multiValueHeaders: { "set-cookie": ["a=1; Path=/"] }
            },
            jwt
        );

        const expected = `wby-id-token=${jwt}; Path=/; Expires=Tue, 01 Jan 2030 00:00:00 GMT; HttpOnly; Secure; SameSite=None`;
        expect(result.cookies).toEqual(["a=1; Path=/", expected]);
        expect(result.multiValueHeaders?.["set-cookie"]).toEqual(["a=1; Path=/", expected]);
        expect(result.headers?.["cache-control"]).toBe(`no-store, no-cache="Set-Cookie"`);
    });

    it("expires the cookie in 24 hours when the token is not a JWT", async () => {
        const before = Date.now();
        const { result } = await invokeApiGateway(
            v1Event({
                method: "POST",
                path: "/graphql",
                headers: { "x-webiny-authorization": `Bearer ${VALID_TOKEN}` }
            })
        );

        expect(result.cookies).toHaveLength(1);
        const setCookie = result.cookies![0];
        expect(setCookie).toMatch(/^wby-id-token=valid-token; Path=\/; Expires=/);
        expect(setCookie).toContain("HttpOnly; Secure; SameSite=None");
        const expires = Date.parse(/Expires=([^;]+)/.exec(setCookie)![1]);
        const day = 24 * 60 * 60 * 1000;
        expect(expires).toBeGreaterThanOrEqual(Math.floor((before + day) / 1000) * 1000);
        expect(expires).toBeLessThanOrEqual(Date.now() + day);
        expect(result.headers?.["cache-control"]).toBe(`no-cache="Set-Cookie"`);
    });

    it("does not set the cookie on an anonymous response", async () => {
        const { result } = await invokeApiGateway(
            v1Event({
                method: "POST",
                path: "/graphql",
                headers: { authorization: "Bearer invalid-token" }
            })
        );
        expect(result.cookies).toBeUndefined();
        expect(result.multiValueHeaders).toBeUndefined();
    });

    it("does not set the cookie on a cookie-authenticated response", async () => {
        const { token, result } = await invokeApiGateway(
            v1Event({ method: "GET", path: "/private/x", headers: { cookie } })
        );
        expect(token).toBe(VALID_TOKEN);
        expect(result.cookies).toBeUndefined();
        expect(result.multiValueHeaders).toBeUndefined();
    });
});

describe("Function URL cookie authentication", () => {
    it("treats a stream request carrying only the cookie as anonymous", async () => {
        const container = createContainer();
        container.registerInstance(FunctionUrlStreamEventHandler, {
            async execute() {
                return undefined;
            }
        });
        container.registerDecorator(FunctionUrlStreamIdentityLoaderDecorator);

        const handler = container.resolve(FunctionUrlStreamEventHandler);
        const event = {
            rawPath: "/private/x",
            headers: { cookie },
            cookies: [cookie],
            requestContext: { http: { method: "GET" } }
        };
        await handler.execute({ event, metadata: {} } as any, async () => undefined);

        expect(container.resolve(RawAuthToken).get()).toBeNull();
    });
});

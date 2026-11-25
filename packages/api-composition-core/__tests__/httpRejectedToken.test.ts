import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/api-kernel-core";
import { HttpRouter } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/RequestIdentityLoader.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/AuthenticationContext.js";
import { AfterAuthenticationEvent } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { JwtAuthenticator } from "@webiny/api-core/idp/JwtAuthenticator.js";
import { OidcJwtIdentityProvider } from "@webiny/api-core/idp/OidcJwtIdentityProvider.js";
import { JwkCache } from "@webiny/api-core/idp/abstractions.js";
import { OidcIdentityProvider } from "@webiny/api-core/idp/abstractions.js";
import { HttpIdentityLoaderDecorator } from "~/http/HttpIdentityLoaderDecorator.js";

const ISSUER = "https://idp.example.com";
const KID = "key-1";
const ORIGIN = "https://admin.example.com";
const ROUTED: IHttpResponse = { statusCode: 200, body: { data: {} } };

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const JWK = { ...publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };

const signToken = (payload: jwt.JwtPayload): string => {
    return jwt.sign({ iss: ISSUER, sub: "user-1", ...payload }, privateKey, {
        algorithm: "RS256",
        keyid: KID
    });
};

interface ISetupParams {
    verifyTokenClaims?: OidcIdentityProvider.Interface["verifyTokenClaims"];
    getKeys?: JwkCache.Interface["getKeys"];
    publish?: EventPublisher.Interface["publish"];
}

/*
 * The whole identity load path a request takes: RequestIdentityLoader, AuthenticationContext,
 * JwtAuthenticator and OidcJwtIdentityProvider, verifying a token signed with a real key, inside the
 * real HttpFeature decorators. The identity decorator is registered before HttpFeature, the way the
 * compositions register it, so the test also proves its 401 and its errors get the CORS headers. Only
 * the OIDC provider's settings, the key cache, the event publisher and the routes are stand-ins.
 */
const setup = (params: ISetupParams = {}) => {
    const route = vi.fn(async () => ROUTED);
    const container = new Container();

    // One holder per request in the handler; a singleton here, so the decorator and the loader share it.
    container.register(RawAuthToken).inSingletonScope();
    container.register(RequestIdentityLoader);
    container.register(AuthenticationContext);
    container.register(JwtAuthenticator);
    container.register(OidcJwtIdentityProvider);
    container.registerInstance(OidcIdentityProvider, {
        issuer: ISSUER,
        isApplicable: payload => payload.iss === ISSUER,
        getIdentity: async payload => {
            return { id: String(payload.sub), displayName: "User", type: "admin" };
        },
        verifyTokenClaims: params.verifyTokenClaims
    });
    container.registerInstance(JwkCache, {
        getKeys: params.getKeys ?? (async () => [JWK]),
        refreshKeys: async () => null
    });
    container.registerInstance(EventPublisher, {
        publish: params.publish ?? (async () => {})
    } as EventPublisher.Interface);
    container.registerInstance(IdentityContext, {
        setIdentity: () => {}
    } as unknown as IdentityContext.Interface);
    container.registerDecorator(HttpIdentityLoaderDecorator);
    HttpFeature.register(container);
    // Stands in for the routes, in place of the HttpRouterImpl HttpFeature registered.
    container.registerInstance(HttpRouter, { route });

    const router = container.resolve(HttpRouter);

    return { router, route };
};

const execute = (router: HttpRouter.Interface, token: string, originHeader = "origin") => {
    const request: IHttpRequest = {
        method: "POST",
        path: "/graphql",
        headers: {
            authorization: `Bearer ${token}`,
            [originHeader]: ORIGIN
        },
        query: {},
        pathParameters: {},
        body: {}
    };

    return router.route(request);
};

const CORS_HEADERS = {
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-credentials": "true",
    vary: "origin"
};

const unauthorized = (code: string, message: string): IHttpResponse => {
    return {
        statusCode: 401,
        headers: {
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"',
            ...CORS_HEADERS
        },
        body: { message, code, data: null }
    };
};

const INTERNAL_SERVER_ERROR: IHttpResponse = {
    statusCode: 500,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
    body: { message: "Internal server error" }
};

describe("HttpIdentityLoaderDecorator inside HttpFeature", () => {
    beforeEach(() => {
        // HttpErrorDecorator logs the errors it answers with a 500.
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("answers 401 when verifyTokenClaims rejects the token", async () => {
        const { router, route } = setup({
            verifyTokenClaims: async () => {
                throw new Error("The token's audience is not this API.");
            }
        });
        const token = signToken({});

        const response = await execute(router, token);

        const expected = unauthorized(
            "Authentication/InvalidToken",
            "The token's audience is not this API."
        );
        expect(response).toEqual(expected);
        expect(route).not.toHaveBeenCalled();
    });

    it("finds the origin for the CORS headers whatever case the header name arrives in", async () => {
        const { router } = setup();
        const expiredAt = Math.floor(Date.now() / 1000) - 60;
        const token = signToken({ exp: expiredAt });

        const response = await execute(router, token, "Origin");

        const expected = unauthorized("Authentication/TokenExpired", "jwt expired");
        expect(response).toEqual(expected);
    });

    it("answers 401 when the token has expired", async () => {
        const { router, route } = setup();
        const expiredAt = Math.floor(Date.now() / 1000) - 60;
        const token = signToken({ exp: expiredAt });

        const response = await execute(router, token);

        const expected = unauthorized("Authentication/TokenExpired", "jwt expired");
        expect(response).toEqual(expected);
        expect(route).not.toHaveBeenCalled();
    });

    it("routes the request when the token is accepted", async () => {
        const { router, route } = setup({
            verifyTokenClaims: async () => {}
        });
        const token = signToken({});

        const response = await execute(router, token);

        expect(response).toEqual({ ...ROUTED, headers: CORS_HEADERS });
        expect(route).toHaveBeenCalledTimes(1);
    });

    it("answers 500, not 401, when fetching the signing keys fails", async () => {
        const { router, route } = setup({
            getKeys: async () => {
                throw new Error("The JWKS request timed out.");
            }
        });
        const token = signToken({});

        const response = await execute(router, token);

        expect(response).toEqual(INTERNAL_SERVER_ERROR);
        expect(route).not.toHaveBeenCalled();
    });

    it("answers 500, not 401, when an AfterAuthenticationEvent handler fails", async () => {
        const { router, route } = setup({
            publish: async event => {
                if (event instanceof AfterAuthenticationEvent) {
                    throw new Error("An AfterAuthenticationEvent handler failed.");
                }
            }
        });
        const token = signToken({});

        const response = await execute(router, token);

        expect(response).toEqual(INTERNAL_SERVER_ERROR);
        expect(route).not.toHaveBeenCalled();
    });
});

import { generateKeyPairSync } from "node:crypto";
import type { IncomingMessage } from "node:http";
import jwt from "jsonwebtoken";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import type { IHttpResponse } from "@webiny/event-handler-core";
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
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";

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
 * The whole identity load path a Node request takes: RequestIdentityLoader, AuthenticationContext,
 * JwtAuthenticator and OidcJwtIdentityProvider, verifying a token signed with a real key. Only the
 * OIDC provider's settings, the key cache, the event publisher and the router are stand-ins.
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
    container.registerInstance(NodeHttpEventHandler, { execute: route });
    container.registerDecorator(NodeHttpIdentityLoaderDecorator);

    const handler = container.resolve(NodeHttpEventHandler);

    return { handler, route };
};

const execute = (handler: NodeHttpEventHandler.Interface, token: string) => {
    const request = {
        headers: {
            authorization: `Bearer ${token}`,
            origin: ORIGIN
        }
    } as unknown as IncomingMessage;

    return handler.execute({ event: request, metadata: {} }, async () => undefined);
};

const unauthorized = (code: string, message: string): IHttpResponse => {
    return {
        statusCode: 401,
        headers: {
            "access-control-allow-origin": ORIGIN,
            "access-control-allow-credentials": "true",
            vary: "origin",
            "content-type": "application/json",
            "www-authenticate": 'Bearer error="invalid_token"'
        },
        body: { message, code, data: null }
    };
};

describe("NodeHttpIdentityLoaderDecorator", () => {
    it("answers 401 when verifyTokenClaims rejects the token", async () => {
        const { handler, route } = setup({
            verifyTokenClaims: async () => {
                throw new Error("The token's audience is not this API.");
            }
        });
        const token = signToken({});

        const response = await execute(handler, token);

        const expected = unauthorized(
            "Authentication/InvalidToken",
            "The token's audience is not this API."
        );
        expect(response).toEqual(expected);
        expect(route).not.toHaveBeenCalled();
    });

    it("answers 401 when the token has expired", async () => {
        const { handler, route } = setup();
        const expiredAt = Math.floor(Date.now() / 1000) - 60;
        const token = signToken({ exp: expiredAt });

        const response = await execute(handler, token);

        const expected = unauthorized("Authentication/TokenExpired", "jwt expired");
        expect(response).toEqual(expected);
        expect(route).not.toHaveBeenCalled();
    });

    it("routes the request when the token is accepted", async () => {
        const { handler, route } = setup({
            verifyTokenClaims: async () => {}
        });
        const token = signToken({});

        const response = await execute(handler, token);

        expect(response).toBe(ROUTED);
        expect(route).toHaveBeenCalledTimes(1);
    });

    it("lets a failure to fetch the signing keys propagate instead of answering 401", async () => {
        const { handler, route } = setup({
            getKeys: async () => {
                throw new Error("The JWKS request timed out.");
            }
        });
        const token = signToken({});

        const result = execute(handler, token);

        await expect(result).rejects.toThrow("The JWKS request timed out.");
        expect(route).not.toHaveBeenCalled();
    });

    it("lets a failing AfterAuthenticationEvent handler propagate instead of answering 401", async () => {
        const { handler, route } = setup({
            publish: async event => {
                if (event instanceof AfterAuthenticationEvent) {
                    throw new Error("An AfterAuthenticationEvent handler failed.");
                }
            }
        });
        const token = signToken({});

        const result = execute(handler, token);

        await expect(result).rejects.toThrow("An AfterAuthenticationEvent handler failed.");
        expect(route).not.toHaveBeenCalled();
    });
});

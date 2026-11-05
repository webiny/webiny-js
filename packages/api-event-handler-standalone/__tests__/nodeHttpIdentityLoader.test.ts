import type { IncomingMessage } from "node:http";
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
import { Authenticator } from "@webiny/api-core/features/security/authentication/Authenticator/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { NodeHttpIdentityLoaderDecorator } from "~/handlers/NodeHttpIdentityLoaderDecorator.js";

const ROUTED: IHttpResponse = { statusCode: 200, body: { data: {} } };

interface ISetupParams {
    authenticate: Authenticator.Interface["authenticate"];
    publish?: EventPublisher.Interface["publish"];
}

/*
 * The real identity load path: RequestIdentityLoader and AuthenticationContext, which turns whatever
 * an authenticator throws into an AuthenticationError. Only the authenticator, the event publisher
 * and the routing terminal are stand-ins.
 */
const setup = (params: ISetupParams) => {
    const route = vi.fn(async () => ROUTED);
    const container = new Container();

    container.register(RawAuthToken);
    container.register(RequestIdentityLoader);
    container.register(AuthenticationContext);
    container.registerInstance(Authenticator, { authenticate: params.authenticate });
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

const request = {
    headers: {
        authorization: "Bearer some.jwt.token",
        origin: "https://admin.example.com"
    }
} as unknown as IncomingMessage;

const execute = (handler: NodeHttpEventHandler.Interface) => {
    return handler.execute({ event: request, metadata: {} }, async () => undefined);
};

describe("NodeHttpIdentityLoaderDecorator", () => {
    it("answers 401 when an identity provider rejects the token", async () => {
        const { handler, route } = setup({
            authenticate: async () => {
                // What a `verifyTokenClaims` that rejects the token does.
                throw new Error("The token's audience is not this API.");
            }
        });

        const response = await execute(handler);

        expect(response).toEqual({
            statusCode: 401,
            headers: {
                "access-control-allow-origin": "https://admin.example.com",
                "access-control-allow-credentials": "true",
                vary: "origin",
                "content-type": "application/json",
                "www-authenticate": 'Bearer error="invalid_token"'
            },
            body: {
                message: "The token's audience is not this API.",
                code: "Authentication/InvalidToken",
                data: null
            }
        });
        expect(route).not.toHaveBeenCalled();
    });

    it("routes the request when the token is accepted", async () => {
        const { handler, route } = setup({
            authenticate: async () => null
        });

        const response = await execute(handler);

        expect(response).toBe(ROUTED);
        expect(route).toHaveBeenCalledTimes(1);
    });

    it("lets an error that is not an authentication error propagate", async () => {
        const { handler, route } = setup({
            authenticate: async () => null,
            publish: async () => {
                throw new Error("The event publisher failed.");
            }
        });

        await expect(execute(handler)).rejects.toThrow("The event publisher failed.");
        expect(route).not.toHaveBeenCalled();
    });
});

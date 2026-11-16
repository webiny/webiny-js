import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { InvalidTokenError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { createWebsocketsAuthenticator } from "~/websockets/createWebsocketsAuthenticator.js";
import { createMockLogger } from "./createMockLogger.js";

// The request stack is what supplies AuthenticationContext; here the root container does.
vi.mock("@webiny/api-event-handler-core", () => ({
    registerApiRequestStack: vi.fn().mockResolvedValue(undefined)
}));

// No extensions: the mocked request stack never reads them.
const extensions = () => [];

describe("createWebsocketsAuthenticator", () => {
    let authenticate: Mock<AuthenticationContext.Interface["authenticate"]>;
    let logger: Logger.Interface;
    let container: Container;

    beforeEach(() => {
        authenticate = vi.fn<AuthenticationContext.Interface["authenticate"]>();
        logger = createMockLogger();
        container = new Container();
        const authentication: AuthenticationContext.Interface = {
            authenticate,
            getAuthToken: () => undefined
        };
        container.registerInstance(AuthenticationContext, authentication);
        container.registerInstance(Logger, logger);
    });

    it("returns the identity a token authenticates as", async () => {
        const identity = new AuthenticatedIdentity({
            id: "user-1",
            displayName: "User One",
            type: "admin"
        });
        authenticate.mockResolvedValue(identity);
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("valid");

        expect(result).toEqual({ id: "user-1", displayName: "User One", type: "admin" });
    });

    // No authenticator recognises the token, so it comes back as the anonymous identity, not an error.
    it("refuses a token that resolves to the anonymous identity", async () => {
        authenticate.mockResolvedValue(new AnonymousIdentity());
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("not-a-jwt");

        expect(result).toBeNull();
    });

    it("refuses a token authentication rejects, and logs why", async () => {
        authenticate.mockRejectedValue(new InvalidTokenError("jwt expired"));
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = await authenticator("expired");

        expect(result).toBeNull();
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it("throws any other error, so the server answers 500", async () => {
        authenticate.mockRejectedValue(new Error("container misconfigured"));
        const authenticator = createWebsocketsAuthenticator(container, extensions);

        const result = authenticator("valid");

        await expect(result).rejects.toThrow("container misconfigured");
    });
});

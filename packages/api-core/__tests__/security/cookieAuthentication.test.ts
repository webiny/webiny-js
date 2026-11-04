import { describe, expect, it } from "vitest";
import { ContextPlugin } from "@webiny/api";
import { createHandler } from "@webiny/handler-aws";
import { createRoute } from "@webiny/handler";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createApiCore } from "~/index.js";
import { authenticateUsingHttpHeader } from "~/legacy/security/plugins/authenticateUsingHttpHeader.js";
import type { ApiCoreContext, ApiCoreStorageOperations } from "~/types/core.js";
import { createRootTenantMock } from "../mocks/createRootTenantMock";

const VALID_TOKEN = "valid-token";
const ATTACKER_ORIGIN = "https://attacker.example";

/**
 * Authenticates only `VALID_TOKEN`, so a request is logged in only if the token
 * reached `context.security.authenticate()` through the header or the cookie.
 */
const tokenAuthenticator = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async token => {
            if (token !== VALID_TOKEN) {
                return null;
            }
            return {
                id: "user-1",
                displayName: "User 1",
                type: "admin"
            };
        });
    });
};

/**
 * Both routes return the identity the request was authenticated as.
 */
const identityRoutes = () => {
    return createRoute<ApiCoreContext>(({ onPost, onGet, context }) => {
        const respond = async (_: unknown, reply: any) => {
            const identity = context.security.getIdentity();
            const id = identity ? identity.id : null;
            // Also as a header, because HEAD responses have no body.
            return reply.header("x-test-identity", String(id)).send({ identity: id });
        };
        onPost("/graphql", respond);
        onGet("/private/*", respond);
        onPost("/private/*", respond);
    });
};

const useHandler = () => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
            createRootTenantMock(),
            authenticateUsingHttpHeader(),
            tokenAuthenticator(),
            identityRoutes()
        ]
    });

    return async (params: {
        httpMethod: "GET" | "HEAD" | "POST";
        path: string;
        headers?: Record<string, string>;
        requestContext?: Record<string, string>;
    }) => {
        const response = await handler(
            {
                path: params.path,
                httpMethod: params.httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["content-type"]: "application/json",
                    ...params.headers
                },
                body: params.httpMethod === "POST" ? JSON.stringify({}) : undefined,
                requestContext: params.requestContext
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        const headers: Record<string, unknown> = {};
        for (const [key, value] of Object.entries({
            ...(response.headers || {}),
            ...(response.multiValueHeaders || {})
        })) {
            headers[key.toLowerCase()] = value;
        }

        return {
            body: JSON.parse(response.body || "{}"),
            headers
        };
    };
};

const getSetCookies = (headers: Record<string, unknown>): string[] => {
    const value = headers["set-cookie"];
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value.map(String) : [String(value)];
};

describe("cookie authentication", () => {
    it("should ignore the cookie on GraphQL requests", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                origin: ATTACKER_ORIGIN,
                cookie: `wby-id-token=${VALID_TOKEN}`
            }
        });

        expect(response.body).toEqual({ identity: null });
    });

    it("should still authenticate GraphQL requests with the Authorization header", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                authorization: `Bearer ${VALID_TOKEN}`
            }
        });

        expect(response.body).toEqual({ identity: "user-1" });
    });

    it("should authenticate private file requests with the cookie", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "GET",
            path: "/private/some-file.png",
            headers: {
                cookie: `wby-id-token=${VALID_TOKEN}`
            }
        });

        expect(response.body).toEqual({ identity: "user-1" });
    });

    it("should authenticate HEAD requests for private files with the cookie", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "HEAD",
            path: "/private/some-file.png",
            headers: {
                cookie: `wby-id-token=${VALID_TOKEN}`
            }
        });

        expect(response.headers["x-test-identity"]).toBe("user-1");
    });

    it("should ignore the cookie on POST requests to private files", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "POST",
            path: "/private/some-file.png",
            headers: {
                cookie: `wby-id-token=${VALID_TOKEN}`
            }
        });

        expect(response.body).toEqual({ identity: null });
    });

    it("should authenticate private file requests that include the API Gateway stage", async () => {
        const invoke = useHandler();

        // This is how API Gateway delivers requests made directly to its "default" stage.
        const response = await invoke({
            httpMethod: "GET",
            path: "/default/private/some-file.png",
            headers: {
                cookie: `wby-id-token=${VALID_TOKEN}`
            },
            requestContext: {
                stage: "default",
                resourcePath: "/private/{path+}"
            }
        });

        expect(response.body).toEqual({ identity: "user-1" });
    });

    it("should keep private file requests without the cookie anonymous", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "GET",
            path: "/private/some-file.png"
        });

        expect(response.body).toEqual({ identity: null });
    });

    it("should still set the cookie on authenticated responses", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                authorization: `Bearer ${VALID_TOKEN}`
            }
        });

        const cookies = getSetCookies(response.headers);
        expect(cookies.some(cookie => cookie.startsWith(`wby-id-token=${VALID_TOKEN}`))).toBe(true);
    });
});

describe("CORS headers", () => {
    it("should not allow credentials for other websites on private files", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "GET",
            path: "/private/some-file.png",
            headers: {
                origin: ATTACKER_ORIGIN,
                cookie: `wby-id-token=${VALID_TOKEN}`
            }
        });

        expect(response.headers["access-control-allow-origin"]).toBe("*");
        expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
    });

    it("should keep the reflected origin with credentials on other routes", async () => {
        const invoke = useHandler();

        const response = await invoke({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                origin: "https://admin.example",
                authorization: `Bearer ${VALID_TOKEN}`
            }
        });

        expect(response.headers["access-control-allow-origin"]).toBe("https://admin.example");
        expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
});

import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouter } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";
import { RawAuthToken as RawAuthTokenImpl } from "@webiny/api-core/features/requestContext/RawAuthToken.js";
import { RawAuthToken } from "@webiny/api-core/features/requestContext/index.js";
import { RequestIdentityLoader } from "@webiny/api-core/features/requestContext/index.js";
import { HttpIdentityLoaderDecorator } from "~/http/HttpIdentityLoaderDecorator.js";

function setup() {
    const container = new Container();
    container.register(RawAuthTokenImpl).inSingletonScope();

    let establishCalled = false;
    container.registerInstance(RequestIdentityLoader, {
        async establish() {
            establishCalled = true;
        }
    });

    let routed = false;
    container.registerInstance(HttpRouter, {
        async route() {
            routed = true;
            return { statusCode: 200, body: {} };
        }
    });
    container.registerDecorator(HttpIdentityLoaderDecorator);

    const router = container.resolve(HttpRouter);

    return {
        run: async (headers: Record<string, string>, method = "POST", path = "/graphql") => {
            const request: IHttpRequest = {
                method,
                path,
                headers,
                query: {},
                pathParameters: {},
                body: {}
            };
            await router.route(request);
        },
        token: () => container.resolve(RawAuthToken).get(),
        establishCalled: () => establishCalled,
        routed: () => routed
    };
}

describe("HttpIdentityLoaderDecorator", () => {
    // Header precedence and cookie decoding are `extractAuthToken`'s; see its tests. These check
    // that the decorator hands it the request's method and path, and lets the request through.
    it("puts the token from a header into RawAuthToken, loads identity, then routes", async () => {
        const t = setup();
        await t.run({ authorization: "Bearer from-authorization" });

        expect(t.token()).toBe("from-authorization");
        expect(t.establishCalled()).toBe(true);
        expect(t.routed()).toBe(true);
    });

    it("puts the token from the wby-id-token cookie into RawAuthToken for a private file", async () => {
        const t = setup();
        await t.run({ cookie: "theme=dark; wby-id-token=abc" }, "GET", "/private/file.png");

        expect(t.token()).toBe("abc");
        expect(t.routed()).toBe(true);
    });

    it("ignores the wby-id-token cookie on a GraphQL request", async () => {
        const t = setup();
        await t.run({ cookie: "wby-id-token=abc" });

        expect(t.token()).toBeNull();
        expect(t.routed()).toBe(true);
    });
});

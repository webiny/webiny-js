import { describe } from "e2e";
import { expect } from "e2e";
import { test } from "e2e";

/*
 * Calls the two routes CI adds to every E2E project before it builds
 * (.github/workflows/wac/utils/runNodeScripts/configureApiRoute.js):
 *
 *   <Api.Route method="GET"  path="/e2e/api-route/{id}" src="/extensions/E2eApiRoute.ts" />
 *   <Api.Route method="POST" path="/e2e/api-route"      src="/extensions/E2eApiRoute.ts" />
 *
 * The handler echoes the request. On AWS a request goes CloudFront, API Gateway, the GraphQL Lambda,
 * then the router; on standalone it goes straight from the Node server to the router. The same
 * assertions hold for both.
 *
 * `E2E_API_URL` is the API's public URL. Without it there is no route to call: a local project has
 * none unless it was added by hand, so the test is skipped.
 */
const API_URL = process.env.E2E_API_URL;

const skip = API_URL ? undefined : "needs E2E_API_URL and a project with the E2E route";

const routeUrl = (path: string) => {
    return new URL(path, API_URL);
};

describe("a custom route declared with Api.Route answers", { tags: ["api-route"], skip }, () => {
    test("GET passes the path parameter to the handler", async () => {
        const url = routeUrl("/e2e/api-route/42");
        const response = await fetch(url);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
            route: "e2e-api-route-get",
            method: "GET",
            pathParameters: { id: "42" },
            body: null
        });
    });

    test("POST passes the JSON body to the handler", async () => {
        const url = routeUrl("/e2e/api-route");
        const payload = { message: "hello", count: 3 };
        const requestBody = JSON.stringify(payload);
        const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: requestBody
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
            route: "e2e-api-route-post",
            method: "POST",
            pathParameters: {},
            body: payload
        });
    });
});

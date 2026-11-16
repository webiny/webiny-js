/*
 * Adds two `<Api.Route>` entries to a scaffolded project's webiny.config.tsx, and the handler they
 * point at, so E2E can call a custom HTTP route on every hosting type (e2e/tests/apiRoute.e2e.ts).
 *
 * - GET  /e2e/api-route/{id}  checks a path parameter, written in API Gateway's `{id}` syntax.
 * - POST /e2e/api-route       checks a JSON body.
 *
 * Both share one handler file, which is a case the route build used to get wrong: it registered
 * only the first route on a file. The handler echoes what it received, so the test can check what
 * reached it, not only the status code.
 *
 * It has to run after `create-webiny-project` and before the build: the route is written into the
 * API bundle at build time.
 *
 * Usage: node configureApiRoute.js '<absolute path to the scaffolded project>'.
 */

import { addToWebinyConfig } from "./configureProject/addToWebinyConfig.js";

const HANDLER_SRC = "/extensions/E2eApiRoute.ts";

const HANDLER = `import { HttpRouteHandler } from "webiny/api";

/*
 * Added by E2E (configureApiRoute.js). Echoes the request, so e2e/tests/apiRoute.e2e.ts can check
 * what reached the handler on each hosting type.
 */
class E2eApiRouteImpl implements HttpRouteHandler.Interface {
    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        return response.status(200).json({
            route: request.route.name,
            method: request.method,
            pathParameters: request.pathParameters,
            body: request.body ?? null
        });
    }
}

export default HttpRouteHandler.createImplementation({
    implementation: E2eApiRouteImpl,
    dependencies: []
});
`;

addToWebinyConfig({
    script: "configureApiRoute.js",
    name: "the E2E API route",
    importLine: 'import { Api } from "webiny/extensions";',
    componentLines: [
        `<Api.Route method={"GET"} path={"/e2e/api-route/{id}"} src={"${HANDLER_SRC}"} />`,
        `<Api.Route method={"POST"} path={"/e2e/api-route"} src={"${HANDLER_SRC}"} />`
    ],
    // The handler path, since a second registration of the same route fails the build.
    marker: HANDLER_SRC,
    files: { [HANDLER_SRC]: HANDLER }
});

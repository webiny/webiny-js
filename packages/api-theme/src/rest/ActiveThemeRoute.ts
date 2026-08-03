import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { ACTIVE_THEME_CACHE_CONTROL, ACTIVE_THEME_ROUTE, NO_CACHE_CONTROL } from "~/constants.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { ARTIFACT_FILES } from "~/features/ThemeArtifacts/index.js";

/**
 * `GET /_webiny/theme/active`
 *
 * Tenant to active-theme-version resolution. The SDK calls this during SSR and then emits a link to
 * the immutable versioned artifact URL, so this response is short-cached rather than immutable.
 *
 * "No active theme" is a 200 with `active: false`, not a 404. It is the default state for every
 * project that has not opted in, and it must not read as an error anywhere in the stack.
 */
class ActiveThemeRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = ACTIVE_THEME_ROUTE;

    constructor(private container: Container) {}

    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        const store = this.container.resolve(ActiveThemeStore);
        const result = await store.get();

        if (result.isFail()) {
            return {
                statusCode: 500,
                headers: { "content-type": "application/json", "cache-control": NO_CACHE_CONTROL },
                body: JSON.stringify({ message: result.error.message })
            };
        }

        const pointer = result.value;

        const body = pointer
            ? {
                  active: true,
                  themeId: pointer.entryId,
                  version: pointer.version,
                  activatedOn: pointer.activatedOn,
                  // Relative paths: the frontend rewrites `/_webiny/theme/*` onto the API, so the
                  // browser fetches these from the site's own origin.
                  artifacts: Object.fromEntries(
                      ARTIFACT_FILES.map(file => [
                          file === "tokens.css" ? "css" : "json",
                          `/_webiny/theme/${pointer.entryId}/${pointer.version}/${file}`
                      ])
                  )
              }
            : { active: false };

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": ACTIVE_THEME_CACHE_CONTROL
            },
            body: JSON.stringify(body)
        };
    }
}

export const ActiveThemeRoute = HttpRoute.createImplementation({
    implementation: ActiveThemeRouteImpl,
    dependencies: [RequestContainer]
});

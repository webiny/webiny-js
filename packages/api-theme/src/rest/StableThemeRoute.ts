import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import {
    NO_CACHE_CONTROL,
    STABLE_THEME_CACHE_CONTROL,
    STABLE_THEME_ROUTE,
    toRevisionId
} from "~/constants.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { GetThemeByIdRepository } from "~/features/GetThemeById/index.js";
import { ThemeArtifactService, isArtifactFile } from "~/features/ThemeArtifacts/index.js";

const json = (statusCode: number, body: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json", "cache-control": NO_CACHE_CONTROL },
    body: JSON.stringify(body)
});

/**
 * `GET /_webiny/theme/{tokens.css|tokens.json|manifest.json}` — see the change brief, C7.
 *
 * The stable, public delivery URL. It always serves whichever version is currently active, at a short
 * TTL, so ISR-cached HTML can point here forever and the CDN refreshes the contents within a minute of
 * an activation. There is no version in the path and no webhook: the TTL is the whole mechanism.
 *
 * "No active theme" is a 204, not a 404 — it is the normal state for a project that has not opted in,
 * and it is cached at the same short TTL so activating the first theme reaches the site on its own.
 */
class StableThemeRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = STABLE_THEME_ROUTE;

    constructor(private container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const { file } = request.pathParameters;

        if (!isArtifactFile(file)) {
            return json(404, { message: `Unknown theme artifact "${file}".` });
        }

        const store = this.container.resolve(ActiveThemeStore);
        const pointer = await store.get();

        if (pointer.isFail()) {
            return json(500, { message: pointer.error.message });
        }

        // No active theme: nothing to serve, but cache the emptiness briefly so the first activation
        // is picked up within the TTL rather than never.
        if (!pointer.value) {
            return {
                statusCode: 204,
                headers: { "cache-control": STABLE_THEME_CACHE_CONTROL },
                body: ""
            };
        }

        const repository = this.container.resolve(GetThemeByIdRepository);
        const found = await repository.execute(
            toRevisionId(pointer.value.entryId, pointer.value.version)
        );

        if (found.isFail()) {
            // The pointer names a version that no longer resolves — treat as no active theme rather
            // than a hard error, so a mid-rollback race degrades to unthemed instead of a 500.
            if (found.error.code === "Theme/NotFound") {
                return {
                    statusCode: 204,
                    headers: { "cache-control": STABLE_THEME_CACHE_CONTROL },
                    body: ""
                };
            }
            return json(500, { message: found.error.message });
        }

        const artifacts = this.container.resolve(ThemeArtifactService);
        const rendered = artifacts.render(found.value, file);

        if (rendered.isFail()) {
            return json(500, { message: rendered.error.message });
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": rendered.value.contentType,
                // Always the short TTL — the URL is stable but its contents change on activation, so
                // it can never be immutable the way a version-stamped URL could.
                "cache-control": STABLE_THEME_CACHE_CONTROL
            },
            body: rendered.value.body
        };
    }
}

export const StableThemeRoute = HttpRoute.createImplementation({
    implementation: StableThemeRouteImpl,
    dependencies: [RequestContainer]
});

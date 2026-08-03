import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import {
    IMMUTABLE_CACHE_CONTROL,
    NO_CACHE_CONTROL,
    THEME_ARTIFACT_ROUTE,
    toRevisionId
} from "~/constants.js";
import { GetThemeByIdRepository } from "~/features/GetThemeById/index.js";
import { ThemeArtifactService, isArtifactFile } from "~/features/ThemeArtifacts/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";

const json = (statusCode: number, body: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json", "cache-control": NO_CACHE_CONTROL },
    body: JSON.stringify(body)
});

/**
 * `GET /_webiny/theme/{themeId}/{version}/{tokens.css|tokens.json}`
 *
 * Access follows what the version is, not who is asking:
 *
 * - A version that has been published carries a frozen snapshot and is served **publicly** with an
 *   immutable TTL. It has to be: the stylesheet is fetched by the visitor's browser through the
 *   frontend's rewrite, and a browser has no API key.
 * - A draft has no snapshot, is rendered on demand, and is gated behind the theme permission. This
 *   is the addressability the preview contract in section 6.5 asks for.
 */
class ThemeArtifactRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = THEME_ARTIFACT_ROUTE;

    constructor(private container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const { themeId, version, file } = request.pathParameters;

        if (!isArtifactFile(file)) {
            return json(404, { message: `Unknown theme artifact "${file}".` });
        }

        const versionNumber = Number.parseInt(version, 10);
        if (!Number.isInteger(versionNumber) || versionNumber < 1) {
            return json(400, { message: `"${version}" is not a valid theme version.` });
        }

        // Resolved lazily: the router constructs every route on each request just to path-match, and
        // these dependencies are only registered once the request container is set up.
        const repository = this.container.resolve(GetThemeByIdRepository);
        const artifacts = this.container.resolve(ThemeArtifactService);

        const found = await repository.execute(toRevisionId(themeId, versionNumber));

        if (found.isFail()) {
            if (found.error.code === "Theme/NotFound") {
                return json(404, {
                    message: `Theme version ${themeId} v${versionNumber} not found.`
                });
            }
            return json(500, { message: found.error.message });
        }

        const theme = found.value;

        if (!theme.resolved) {
            const permissions = this.container.resolve(ThemePermissions);
            if (!(await permissions.canRead("theme"))) {
                // Deliberately 404, not 403: an unauthenticated caller should not be able to probe
                // which draft versions exist.
                return json(404, {
                    message: `Theme version ${themeId} v${versionNumber} not found.`
                });
            }
        }

        const rendered = artifacts.render(theme, file);

        if (rendered.isFail()) {
            return json(422, {
                message: rendered.error.message,
                blockers: rendered.error.data?.blockers ?? []
            });
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": rendered.value.contentType,
                "cache-control": rendered.value.immutable
                    ? IMMUTABLE_CACHE_CONTROL
                    : NO_CACHE_CONTROL
            },
            body: rendered.value.body
        };
    }
}

export const ThemeArtifactRoute = HttpRoute.createImplementation({
    implementation: ThemeArtifactRouteImpl,
    dependencies: [RequestContainer]
});

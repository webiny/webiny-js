import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { NO_CACHE_CONTROL, THEME_PREVIEW_ROUTE, toRevisionId } from "~/constants.js";
import { GetThemeByIdRepository } from "~/features/GetThemeById/index.js";
import { ThemeArtifactService, isArtifactFile } from "~/features/ThemeArtifacts/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";

const json = (statusCode: number, body: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json", "cache-control": NO_CACHE_CONTROL },
    body: JSON.stringify(body)
});

/**
 * `GET /_webiny/theme/preview/{themeId}/{version}/{file}` — see the change brief, C7 and section 6.5.
 *
 * Preview is the only place a specific version stays addressable now that public delivery serves the
 * active version at a stable URL. It targets a draft (or any version) explicitly, is gated behind the
 * theme permission, and is never cached — a draft is rendered on demand and changes constantly.
 *
 * A draft that is not yet valid returns its blocker list, which is what lets the editor show why a
 * preview cannot render.
 */
class ThemePreviewRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = THEME_PREVIEW_ROUTE;

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

        // Preview is never public: a specific version is only addressable to someone who can read
        // themes. A 404 rather than 403 so an unauthenticated caller cannot probe which versions exist.
        const permissions = this.container.resolve(ThemePermissions);
        if (!(await permissions.canRead("theme"))) {
            return json(404, { message: `Theme version ${themeId} v${versionNumber} not found.` });
        }

        const repository = this.container.resolve(GetThemeByIdRepository);
        const found = await repository.execute(toRevisionId(themeId, versionNumber));

        if (found.isFail()) {
            if (found.error.code === "Theme/NotFound") {
                return json(404, {
                    message: `Theme version ${themeId} v${versionNumber} not found.`
                });
            }
            return json(500, { message: found.error.message });
        }

        const artifacts = this.container.resolve(ThemeArtifactService);
        const rendered = artifacts.render(found.value, file);

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
                "cache-control": NO_CACHE_CONTROL
            },
            body: rendered.value.body
        };
    }
}

export const ThemePreviewRoute = HttpRoute.createImplementation({
    implementation: ThemePreviewRouteImpl,
    dependencies: [RequestContainer]
});

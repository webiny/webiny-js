import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { ApiPulumi } from "~/abstractions/features/pulumi/index.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import { ApiRoute } from "./ApiRoute.js";
import { ApiGraphql } from "~/pulumi/apps/api/ApiGraphql.js";
import { toApiGatewayPath } from "./routePath.js";

function deriveRouteName(routePath: string, method: string): string {
    // /asd/{id}/xs + POST → asd-xs-post. Strips parameters in either syntax.
    const pathPart = routePath
        .replace(/^\//, "")
        .replace(/\{[^}]*\}/g, "")
        .replace(/(^|\/):[^/]+/g, "$1")
        .replace(/\/+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return `${pathPart}-${method.toLowerCase()}`;
}

class RegisterRoutesPulumiImpl implements ApiPulumi.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute(app: ApiPulumiApp): Promise<void> {
        // No tags filter — finds ApiRestRoute extensions regardless of their runtimeContext.
        const projectConfig = await this.getProjectConfigService.execute();
        const routeExtensions = projectConfig.extensionsByType(ApiRoute);

        if (!routeExtensions.length) {
            return;
        }

        const graphqlModule = app.getModule(ApiGraphql);

        for (const ext of routeExtensions) {
            const { path: routePath, method, routeName } = ext.params;
            const name = routeName ?? deriveRouteName(routePath, method);
            graphqlModule.addRoute({
                name,
                // The prop accepts `:id` too; API Gateway only understands `{id}`.
                path: toApiGatewayPath(routePath) as `/${string}`,
                method
            });
        }
    }
}

export const RegisterRoutesPulumi = ApiPulumi.createImplementation({
    implementation: RegisterRoutesPulumiImpl,
    dependencies: [GetProjectConfigService]
});

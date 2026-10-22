import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { ApiPulumi } from "~/abstractions/features/pulumi/index.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import { ApiRoute } from "./ApiRoute.js";
import { deriveRouteName, toApiGatewayPath } from "./routePath.js";

class RegisterRoutesPulumiImpl implements ApiPulumi.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute(app: ApiPulumiApp): Promise<void> {
        // No tags filter — finds ApiRestRoute extensions regardless of their runtimeContext.
        const projectConfig = await this.getProjectConfigService.execute();
        const routeExtensions = projectConfig.extensionsByType(ApiRoute);

        if (!routeExtensions.length) {
            return;
        }

        // Imported here rather than at the top of the file. Every CLI command imports this extension
        // when the project SDK registers it, even `webiny --help`, and `ApiGraphql` pulls in all of
        // Pulumi and the AWS SDK: about 2,700 modules. By the time `execute` runs we are inside a
        // Pulumi program that has already loaded all of that, so importing it here costs nothing.
        const { ApiGraphql } = await import("~/pulumi/apps/api/ApiGraphql.js");

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

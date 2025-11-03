import { createImplementation } from "@webiny/di";
import { GetProductionEnvironments, GetProjectConfigService } from "~/abstractions/index.js";
import { productionEnvironments as productionEnvironmentsExtension } from "~/extensions/pulumi/index.js";

export class DefaultGetProductionEnvironments implements GetProductionEnvironments.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();

        let productionEnvironments = ["prod", "production"];
        const [productionEnvironmentsExt] = projectConfig.extensionsByType(
            productionEnvironmentsExtension
        );

        if (productionEnvironmentsExt) {
            productionEnvironments = [
                ...productionEnvironments,
                ...productionEnvironmentsExt.params.environments
            ];
        }

        // Ensure uniqueness.
        return Array.from(new Set(productionEnvironments)).sort();
    }
}

export const getProductionEnvironments = createImplementation({
    abstraction: GetProductionEnvironments,
    implementation: DefaultGetProductionEnvironments,
    dependencies: [GetProjectConfigService]
});

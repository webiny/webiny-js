import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/abstractions/index.js";
import {
    GetProductionEnvironments,
    GetProjectConfigService,
    ProjectSdkParamsService
} from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import { isVpcEnabled } from "~/pulumi/apps/extensions/isVpcEnabled.js";
import { getOsConfigFromExtension } from "~/pulumi/apps/extensions/getOsConfigFromExtension.js";
import { getBgDeploymentsConfigFromExtension } from "~/pulumi/apps/extensions/getBgDeploymentsConfigFromExtension.js";

const CONFIG_FILE = "webiny.config.tsx";

/**
 * Stops `deploy core` when `<Infra.Postgres />` is combined with settings it can't run with:
 *
 * - no VPC: the database sits in private subnets, and the functions reach Secrets Manager through
 *   the VPC's NAT gateway. Production environments get a VPC by default, so this only asks for
 *   `<Infra.Vpc enabled />` elsewhere. Postgres never turns the VPC on by itself, because the NAT
 *   gateway costs money.
 * - an existing VPC without `postgresVpcConfig`: there's no subnet or security group to put the
 *   database in.
 * - OpenSearch, and blue-green deployments (which bring the Sync System): both are DynamoDB-only.
 */
export class ValidatePostgresBeforeCoreDeployImpl implements CoreBeforeDeploy.Interface {
    constructor(
        private getProjectConfigService: GetProjectConfigService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private getProductionEnvironments: GetProductionEnvironments.Interface
    ) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();
        const { env } = this.projectSdkParamsService.get();
        const productionEnvironments = await this.getProductionEnvironments.execute();
        const isProduction = productionEnvironments.includes(env);

        const vpcConfig = getVpcConfigFromExtension(projectConfig);
        if (!isVpcEnabled(vpcConfig, isProduction)) {
            throw GracefulError.from(
                new Error("Cannot deploy Postgres without a VPC."),
                [
                    "The Postgres database runs in the VPC's private subnets, and the API functions reach it, and Secrets Manager, from inside the VPC.",
                    "",
                    "Add %s to your %s config file. The VPC adds a NAT gateway, which has its own cost.",
                    "Production environments use a VPC by default, unless %s turns it off."
                ].join("\n"),
                "<Infra.Vpc enabled />",
                CONFIG_FILE,
                "<Infra.Vpc enabled={false} />"
            );
        }

        if (typeof vpcConfig === "object" && vpcConfig.useExistingVpc) {
            const postgresVpcConfig = vpcConfig.useExistingVpc.postgresVpcConfig;
            if (!postgresVpcConfig?.subnetIds?.length) {
                throw GracefulError.from(
                    new Error(
                        "Cannot deploy Postgres into an existing VPC without `postgresVpcConfig`."
                    ),
                    [
                        "With %s, Webiny doesn't know which subnets and security groups the database should use.",
                        "",
                        "Add %s to %s in your %s config file.",
                        "The security groups must accept port 5432 from the Lambda functions' security groups."
                    ].join("\n"),
                    "useExistingVpc",
                    "postgresVpcConfig: { subnetIds, securityGroupIds }",
                    "<Infra.Vpc useExistingVpc={...} />",
                    CONFIG_FILE
                );
            }
        }

        if (getOsConfigFromExtension(projectConfig)) {
            throw GracefulError.from(
                new Error("Cannot deploy Postgres with OpenSearch enabled."),
                [
                    "OpenSearch only works with the DynamoDB database setup.",
                    "",
                    "Remove %s, or remove %s, from your %s config file."
                ].join("\n"),
                "<Infra.OpenSearch enabled />",
                "<Infra.Postgres />",
                CONFIG_FILE
            );
        }

        const bgDeploymentsConfig = getBgDeploymentsConfigFromExtension(projectConfig);
        if (bgDeploymentsConfig && bgDeploymentsConfig.enabled) {
            throw GracefulError.from(
                new Error("Cannot deploy Postgres with blue-green deployments."),
                [
                    "Blue-green deployments and the Sync System only work with the DynamoDB database setup.",
                    "",
                    "Remove %s, or remove %s, from your %s config file."
                ].join("\n"),
                "<Infra.BlueGreenDeployments enabled />",
                "<Infra.Postgres />",
                CONFIG_FILE
            );
        }
    }
}

export const ValidatePostgresBeforeCoreDeploy = CoreBeforeDeploy.createImplementation({
    implementation: ValidatePostgresBeforeCoreDeployImpl,
    dependencies: [GetProjectConfigService, ProjectSdkParamsService, GetProductionEnvironments]
});

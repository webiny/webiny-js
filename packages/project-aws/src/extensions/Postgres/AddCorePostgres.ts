import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { CorePulumi } from "@webiny/project-extensions-aws/abstractions/features/pulumi/index.js";
import type { CorePulumiApp } from "~/pulumi/apps/core/createCorePulumiApp.js";
import { CoreVpc } from "~/pulumi/apps/core/CoreVpc.js";
import { CorePostgres, type PostgresNetwork } from "~/pulumi/apps/core/CorePostgres.js";
import { getPostgresConfigFromExtension } from "~/pulumi/apps/extensions/getPostgresConfigFromExtension.js";
import { getRdsProxyConfigFromExtension } from "~/pulumi/apps/extensions/getRdsProxyConfigFromExtension.js";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import type { VpcExtensionConfig } from "~/pulumi/apps/extensions/isVpcEnabled.js";

/**
 * Where the database goes. With an existing VPC: the subnets and security groups of its
 * `postgresVpcConfig`. Otherwise: the private subnets of the VPC the core app creates, and its
 * default security group, which the API functions use too, so they reach the database without
 * extra rules.
 *
 * `ValidatePostgresBeforeCoreDeploy` already stopped the deploy if neither exists; this throws
 * for a Pulumi run that skipped the deploy hooks.
 */
export const getPostgresNetwork = (
    app: Pick<CorePulumiApp, "getModule">,
    vpcConfig: VpcExtensionConfig
): PostgresNetwork => {
    if (typeof vpcConfig === "object" && vpcConfig.useExistingVpc) {
        const postgresVpcConfig = vpcConfig.useExistingVpc.postgresVpcConfig;
        if (!postgresVpcConfig) {
            throw new Error(
                "Cannot deploy Postgres into an existing VPC: `useExistingVpc` has no `postgresVpcConfig`."
            );
        }
        return {
            subnetIds: postgresVpcConfig.subnetIds,
            securityGroupIds: postgresVpcConfig.securityGroupIds
        };
    }

    const vpc = app.getModule(CoreVpc, { optional: true });
    if (!vpc) {
        throw new Error("Cannot deploy Postgres without a VPC: add <Infra.Vpc enabled />.");
    }

    return {
        subnetIds: vpc.subnets.private.map(subnet => subnet.output.id),
        securityGroupIds: [vpc.vpc.output.defaultSecurityGroupId]
    };
};

/**
 * Adds the Postgres database (`CorePostgres`) to the core app, and the outputs the API app
 * connects with. Rendered by `<Infra.Postgres />`.
 */
export class AddCorePostgresImpl implements CorePulumi.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute(app: CorePulumiApp) {
        const projectConfig = await this.getProjectConfigService.execute();
        const postgres = getPostgresConfigFromExtension(projectConfig);
        if (!postgres) {
            return;
        }

        const network = getPostgresNetwork(app, getVpcConfigFromExtension(projectConfig));

        const { outputs } = app.addModule(CorePostgres, {
            ...postgres,
            rdsProxy: getRdsProxyConfigFromExtension(projectConfig),
            network,
            protect: app.env.isProduction
        });

        app.addOutputs(outputs);
    }
}

export const AddCorePostgres = CorePulumi.createImplementation({
    implementation: AddCorePostgresImpl,
    dependencies: [GetProjectConfigService]
});

import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/abstractions/index.js";
import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { getPostgresConfigFromExtension } from "~/pulumi/apps/extensions/getPostgresConfigFromExtension.js";

/**
 * `<Infra.RdsProxy enabled />` puts a proxy in front of the Postgres database Webiny creates, so it
 * means nothing without `<Infra.Postgres />`. Rendered only while the proxy is enabled.
 */
export class EnsurePostgresWithRdsProxyImpl implements CoreBeforeDeploy.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();
        if (getPostgresConfigFromExtension(projectConfig)) {
            return;
        }

        throw GracefulError.from(
            new Error("Cannot deploy an RDS Proxy without Postgres."),
            [
                "The RDS Proxy sits in front of the Postgres database, and this project has none.",
                "",
                "Add %s to your %s config file, or remove %s."
            ].join("\n"),
            "<Infra.Postgres />",
            "webiny.config.tsx",
            "<Infra.RdsProxy enabled />"
        );
    }
}

export const EnsurePostgresWithRdsProxy = CoreBeforeDeploy.createImplementation({
    implementation: EnsurePostgresWithRdsProxyImpl,
    dependencies: [GetProjectConfigService]
});

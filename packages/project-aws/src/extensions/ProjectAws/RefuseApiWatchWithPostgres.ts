import { ApiBeforeWatch } from "@webiny/project/abstractions/index.js";
import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { getPostgresConfigFromExtension } from "~/pulumi/apps/extensions/getPostgresConfigFromExtension.js";

/**
 * Watching the API on AWS replaces the deployed functions with forwarders and runs every request
 * on the developer's machine, with the deployed function's env. With `<Infra.Postgres />` that env
 * points at Aurora in the VPC's private subnets, which the machine can't reach, so every request
 * would time out. Watch is refused before anything is built or replaced.
 *
 * Unconditional: `--no-deployment-checks` doesn't skip it, because watch can't work at all.
 */
export class RefuseApiWatchWithPostgresImpl implements ApiBeforeWatch.Interface {
    constructor(
        private getProjectConfigService: GetProjectConfigService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();
        if (!getPostgresConfigFromExtension(projectConfig)) {
            return;
        }

        const error = new Error(`Cannot watch the API of a project that uses Postgres on AWS.`);
        const sdkParams = this.projectSdkParamsService.get();
        const cmd = `yarn webiny deploy api --env ${sdkParams.env}`;

        throw GracefulError.from(
            error,
            [
                "Watch isn't supported with %s on AWS: the database is in the VPC's private",
                "subnets, which your machine can't reach. To try your changes, deploy them",
                "instead by running: %s."
            ].join(" "),
            "<Infra.Postgres />",
            cmd
        );
    }
}

export const RefuseApiWatchWithPostgres = ApiBeforeWatch.createImplementation({
    implementation: RefuseApiWatchWithPostgresImpl,
    dependencies: [GetProjectConfigService, ProjectSdkParamsService]
});

import { createImplementation } from "@webiny/di";
import {
    DeployApp,
    BuildAppWorkspaceService,
    WatchedLambdaFunctionsService,
    GetApp,
    GetProject,
    GetPulumiService,
    LoggerService,
    ProjectSdkParamsService,
    PulumiGetSecretsProviderService,
    PulumiGetStackOutputService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import {
    createEnvConfiguration,
    withEnv,
    withEnvVariant,
    withProjectName,
    withPulumiConfigPassphrase,
    withRegion
} from "~/utils/env/index.js";

export class DefaultDeployApp implements DeployApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private getProject: GetProject.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface,
        private pulumiGetSecretsProviderService: PulumiGetSecretsProviderService.Interface,
        private logger: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface,
        private watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getApp.execute(params.app);

        await this.pulumiSelectStackService.execute(app);

        // A Pulumi refresh might be executed before the deploy. For example,
        // this is needed if the user run the watch command prior to the deploy.
        // await executeRefresh(commandParams);

        const pulumi = await this.getPulumiService.execute({ app });
        const project = await this.getProject.execute();
        const sdkParams = this.projectSdkParamsService.get();

        const env = createEnvConfiguration({
            configurations: [
                withRegion({ region: sdkParams.region }),
                withEnv({ env: sdkParams.env }),
                withEnvVariant({ variant: sdkParams.variant }),
                withProjectName({ project }),
                withPulumiConfigPassphrase()
            ]
        });

        const secretsProvider = this.pulumiGetSecretsProviderService.execute();

        // Get Lambda URNs that need replacement for this app
        const lambdaUrnsToReplace = this.watchedLambdaFunctionsService.getDirty(app.name);

        const pulumiProcess = params.preview
            ? pulumi.run({
                  command: "preview",
                  args: {
                      diff: true,
                      debug: !!params.debug

                      // Preview command does not accept "--secrets-provider" argument.
                      // secretsProvider: PULUMI_SECRETS_PROVIDER
                  },
                  execa: { env }
              })
            : pulumi.run({
                  command: "up",
                  args: {
                      yes: true,
                      skipPreview: true,
                      secretsProvider,
                      debug: !!params.debug,
                      // Only replace specific Lambdas that were updated during watch if any exist
                      replace: lambdaUrnsToReplace.length > 0 ? lambdaUrnsToReplace : undefined
                  },
                  execa: { env }
              });

        // If custom output function is provided, use it. While doing so, we must wait
        // for it to resolve before finishing the build process.
        let output = Promise.resolve();
        if (params.output) {
            output = params.output(pulumiProcess);
        } else {
            this.logger.info(`No output function provided, skipping output.`);
        }

        // Promise is returned so that the caller can await it if needed.
        await pulumiProcess;
        await output;

        // Clear Lambda URNs that needed replacement after successful deployment
        this.watchedLambdaFunctionsService.clearDirty(app.name);

        // Update the stack output cache after successful deployment
        try {
            await this.pulumiGetStackOutputService.execute(app, { skipCache: true });
        } catch (error) {
            // Cache refresh failure shouldn't affect deployment success
            this.logger.error("Failed to update stack output cache after deployment.", error);
        }
    }
}

export const deployApp = createImplementation({
    abstraction: DeployApp,
    implementation: DefaultDeployApp,
    dependencies: [
        GetApp,
        BuildAppWorkspaceService,
        GetProject,
        PulumiSelectStackService,
        GetPulumiService,
        PulumiGetSecretsProviderService,
        LoggerService,
        ProjectSdkParamsService,
        PulumiGetStackOutputService,
        WatchedLambdaFunctionsService
    ]
});

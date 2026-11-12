import { type Container } from "@webiny/di";
import { ProjectSdk } from "@webiny/project";
import { type ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { type AppName } from "@webiny/project";
import { DeployApp } from "@webiny/project-extensions-aws/abstractions/features/DeployApp.js";
import { DestroyApp } from "~/abstractions/features/DestroyApp.js";
import { ExportStack } from "~/abstractions/features/ExportStack.js";
import { GetAppOutput } from "~/abstractions/features/GetAppOutput.js";
import { GetAppStackOutput } from "~/abstractions/features/GetAppStackOutput.js";
import { GetPulumiResourceNamePrefix } from "~/abstractions/features/GetPulumiResourceNamePrefix.js";
import { RefreshApp } from "~/abstractions/features/RefreshApp.js";
import { RunPulumiCommand } from "~/abstractions/features/RunPulumiCommand.js";
import { ListDeployedEnvironmentsService } from "~/abstractions/services/ListDeployedEnvironmentsService.js";
import { registerAwsProjectFeatures } from "~/registerAwsProjectFeatures.js";
import { registerAwsPulumiServices } from "~/registerAwsProjectFeatures.js";

/**
 * `ProjectSdk` plus the deploy and Pulumi methods. Create it with `createForCli` or
 * `createForPulumiProgram`, which register the AWS features these methods resolve, so an instance
 * without them can't be built.
 */
export class AwsProjectSdk extends ProjectSdk {
    private static readonly instances = new WeakMap<Container, AwsProjectSdk>();

    // The AWS CLI's SDK: Pulumi services, deploy hooks and decorators, and the workspace builders.
    public static async createForCli(params: Partial<ProjectSdkParamsService.Params>) {
        const projectSdk = await ProjectSdk.init(params, registerAwsProjectFeatures);
        return AwsProjectSdk.forContainer(projectSdk.getContainer());
    }

    /*
     * The SDK of the Pulumi program, the separate process Pulumi starts during a deploy. It gets the
     * Pulumi services only, so the CLI's deploy decorators and workspace builders don't run again
     * mid-deploy. Empty params: env, variant and region come from the parent process.
     */
    public static async createForPulumiProgram() {
        const projectSdk = await ProjectSdk.init({}, registerAwsPulumiServices);
        return AwsProjectSdk.forContainer(projectSdk.getContainer());
    }

    // `ProjectSdk.init` caches the container, so the same container gets the same instance.
    private static forContainer(container: Container) {
        const existing = AwsProjectSdk.instances.get(container);
        if (existing) {
            return existing;
        }
        const instance = new AwsProjectSdk(container);
        AwsProjectSdk.instances.set(container, instance);
        return instance;
    }

    /*
     * Here we have two stack output methods. Both do the same thing, but one is returning
     * raw Pulumi output, while the other is returning a JSON, which is far more suitable
     * in multiple places throughout the codebase (like Pulumi code, deploy hooks, ...).
     * TODO: we could probably merge these two methods into one, and have an option to return
     * TODO: raw or JSON output. For now, just writing it here.
     */
    public async getAppOutput(params: GetAppOutput.Params) {
        return this.container.resolve(GetAppOutput).execute(params);
    }

    public async getAppStackOutput<
        TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput
    >(appName: AppName) {
        return this.container.resolve(GetAppStackOutput).execute<TOutput>(appName);
    }

    public async getAppStackExport<
        TExport extends ExportStack.StackExport = ExportStack.StackExport
    >(params: ExportStack.Params) {
        return this.container.resolve(ExportStack).execute<TExport>(params);
    }

    public deployApp(params: DeployApp.Params) {
        return this.container.resolve(DeployApp).execute(params);
    }

    public destroyApp(params: DestroyApp.Params) {
        return this.container.resolve(DestroyApp).execute(params);
    }

    public refreshApp(params: RefreshApp.Params) {
        return this.container.resolve(RefreshApp).execute(params);
    }

    public runPulumiCommand(params: RunPulumiCommand.Params) {
        return this.container.resolve(RunPulumiCommand).execute(params);
    }

    public getPulumiResourceNamePrefix() {
        return this.container.resolve(GetPulumiResourceNamePrefix).execute();
    }

    public listDeployedEnvironments() {
        return this.container.resolve(ListDeployedEnvironmentsService).execute();
    }
}

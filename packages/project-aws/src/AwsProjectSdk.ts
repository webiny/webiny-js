import { type ProjectSdk } from "@webiny/project";
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

/**
 * The deploy and Pulumi side of the project SDK. It resolves from the same container as the
 * `ProjectSdk` it wraps, so that SDK has to be created with `registerAwsProjectFeatures` or
 * `registerAwsPulumiServices`.
 */
export class AwsProjectSdk {
    public constructor(private readonly projectSdk: ProjectSdk) {}

    // Here we have two stack output methods. Both do the same thing, but one is returning
    // raw Pulumi output, while the other is returning a JSON, which is far more suitable
    // in multiple places throughout the codebase (like Pulumi code, deploy hooks, ...).
    // TODO: we could probably merge these two methods into one, and have an option to return
    // TODO: raw or JSON output. For now, just writing it here.
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

    private get container() {
        return this.projectSdk.getContainer();
    }
}

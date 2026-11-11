import { ProjectSdk } from "@webiny/project";
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
 * `ProjectSdk` plus the deploy and Pulumi methods. `getAwsProjectSdk` and the AWS CLI create it with
 * the AWS features registered; `from` gives an existing `ProjectSdk` these methods, and its container
 * needs `registerAwsProjectFeatures` or `registerAwsPulumiServices` for them to resolve.
 */
export class AwsProjectSdk extends ProjectSdk {
    public static from(projectSdk: ProjectSdk): AwsProjectSdk {
        if (projectSdk instanceof AwsProjectSdk) {
            return projectSdk;
        }
        return new AwsProjectSdk(projectSdk.getContainer());
    }

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
}

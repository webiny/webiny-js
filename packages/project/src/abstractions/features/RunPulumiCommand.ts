import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

interface IRunPulumiCommandParams {
    app: AppName;
    command: string[];
}

interface IRunPulumiCommand {
    execute(params: IRunPulumiCommandParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const RunPulumiCommand = createAbstraction<IRunPulumiCommand>("RunPulumiCommand");

export namespace RunPulumiCommand {
    export type Interface = IRunPulumiCommand;

    export type Params = IRunPulumiCommandParams;

    export type PulumiProcess = IPulumiProcess;
}

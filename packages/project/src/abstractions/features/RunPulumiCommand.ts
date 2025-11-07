import { Abstraction } from "@webiny/di";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

interface IRunPulumiCommandParams extends IBaseAppParams {
    command: string[];
}

interface IRunPulumiCommand {
    execute(params: IRunPulumiCommandParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const RunPulumiCommand = new Abstraction<IRunPulumiCommand>("RunPulumiCommand");

export namespace RunPulumiCommand {
    export type Interface = IRunPulumiCommand;

    export type Params = IRunPulumiCommandParams;

    export type PulumiProcess = IPulumiProcess;
}

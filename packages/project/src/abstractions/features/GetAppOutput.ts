import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

export interface IGetAppOutputParams {
    app: AppName;
    json?: boolean;
}

export interface IGetAppOutput {
    execute(params: IGetAppOutputParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const GetAppOutput = createAbstraction<IGetAppOutput>("GetAppOutput");

export namespace GetAppOutput {
    export type Interface = IGetAppOutput;

    export type Params = IGetAppOutputParams;
}

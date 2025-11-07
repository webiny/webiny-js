import { Abstraction } from "@webiny/di";

export interface IRunCliRunnerService {
    execute(argv: string[]): any;
}

export const RunCliRunnerService = new Abstraction<IRunCliRunnerService>("RunCliRunnerService");

export namespace RunCliRunnerService {
    export type Interface = IRunCliRunnerService;
}

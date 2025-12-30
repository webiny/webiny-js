import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IRunCliRunnerService {
    execute(): any;
}

export const RunCliRunnerService = createAbstraction<IRunCliRunnerService>("RunCliRunnerService");

export namespace RunCliRunnerService {
    export type Interface = IRunCliRunnerService;
}

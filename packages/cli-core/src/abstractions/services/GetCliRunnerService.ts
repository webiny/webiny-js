import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetCliRunnerService {
    execute(): Promise<any>;
}

export const GetCliRunnerService = createAbstraction<IGetCliRunnerService>("GetCliRunnerService");

export namespace GetCliRunnerService {
    export type Interface = IGetCliRunnerService;
}

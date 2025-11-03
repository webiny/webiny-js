import { Abstraction } from "@webiny/di";

export interface IGetCliRunnerService {
    execute(): Promise<any>;
}

export const GetCliRunnerService = new Abstraction<IGetCliRunnerService>("GetCliRunnerService");

export namespace GetCliRunnerService {
    export type Interface = IGetCliRunnerService;
}

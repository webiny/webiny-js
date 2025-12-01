import { Abstraction } from "@webiny/di";

export interface ICliParams {
    cwd?: string;
}

export interface ICliParamsService {
    get(): ICliParams;
    set(params: ICliParams): void;
}

export const CliParamsService = new Abstraction<ICliParamsService>("CliParamsService");

export namespace CliParamsService {
    export type Interface = ICliParamsService;
    export type Params = ICliParams;
}

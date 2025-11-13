import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { ExtensionDefinitionModel } from "@webiny/project/extensions/index.js";
import { Abstraction } from "@webiny/di";

export interface ICliParams {
    cwd?: string;
    extensions?: ExtensionDefinitionModel<any>[];
}

export interface ICliParamsService {
    get(): ICliParams;
    set(params: ICliParams): void;
}

export const CliParamsService = new Abstraction<ICliParamsService>("CliParamsService");
// export const CliParamsService = createAbstraction<ICliParamsService>("CliParamsService");

export namespace CliParamsService {
    export type Interface = ICliParamsService;
    export type Params = ICliParams;
}

import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { ParsedArgv } from "./ArgvParserService.js";

export interface IGetArgvService {
    execute<T = Record<string, any>>(): ParsedArgv<T>;
}

export const GetArgvService = createAbstraction<IGetArgvService>("GetArgvService");

export namespace GetArgvService {
    export type Interface = IGetArgvService;
}


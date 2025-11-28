import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface GlobalArgv {
    showLogs: boolean;
    logLevel: "silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    stackTrace: boolean;
}

export type ParsedArgv<T = Record<string, any>> = GlobalArgv & T;

export interface IArgvParserService {
    parse<T = Record<string, any>>(argv: string[]): ParsedArgv<T>;
}

export const ArgvParserService = createAbstraction<IArgvParserService>("ArgvParserService");

export namespace ArgvParserService {
    export type Interface = IArgvParserService;
}


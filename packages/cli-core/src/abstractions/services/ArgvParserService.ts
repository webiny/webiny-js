import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IArgvParserService {
    parse<T = Record<string, any>>(argv: string[]): T;
}

export const ArgvParserService = createAbstraction<IArgvParserService>("ArgvParserService");

export namespace ArgvParserService {
    export type Interface = IArgvParserService;
}

import { Abstraction } from "@webiny/di";

export interface IStdioService {
    getStdout(): NodeJS.WriteStream;

    getStderr(): NodeJS.WriteStream;

    getStdin(): NodeJS.ReadStream;
}

export const StdioService = new Abstraction<IStdioService>("StdioService");

export namespace StdioService {
    export type Interface = IStdioService;
}

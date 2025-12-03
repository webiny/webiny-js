import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IStdioService {
    getStdout(): NodeJS.WriteStream;

    getStderr(): NodeJS.WriteStream;

    getStdin(): NodeJS.ReadStream;
}

export const StdioService = createAbstraction<IStdioService>("StdioService");

export namespace StdioService {
    export type Interface = IStdioService;
}

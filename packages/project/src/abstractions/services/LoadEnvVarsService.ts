import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface ILoadEnvVarsService {
    execute(): Promise<void>;
}

export const LoadEnvVarsService = createAbstraction<ILoadEnvVarsService>("LoadEnvVarsService");

export namespace LoadEnvVarsService {
    export type Interface = ILoadEnvVarsService;
}

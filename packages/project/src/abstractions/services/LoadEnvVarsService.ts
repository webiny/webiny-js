import { Abstraction } from "@webiny/di-container";

export interface ILoadEnvVarsService {
    execute(): Promise<void>;
}

export const LoadEnvVarsService = new Abstraction<ILoadEnvVarsService>("LoadEnvVarsService");

export namespace LoadEnvVarsService {
    export type Interface = ILoadEnvVarsService;
}

import { createAbstraction } from "@webiny/feature/api";

export interface IBuildParam {
    key: string;
    value: string;
}

export const BuildParam = createAbstraction<IBuildParam>("BuildParam");

export namespace BuildParam {
    export type Interface = IBuildParam;
}

export interface IBuildParamRegistry {
    get(key: string): string | null;
}

export const BuildParamRegistry = createAbstraction<IBuildParamRegistry>("BuildParamRegistry");

export namespace BuildParamRegistry {
    export type Interface = IBuildParamRegistry;
}

import { createAbstraction } from "@webiny/feature/api";

export interface IBuildParam {
    key: string;
    value: string;
}

export const BuildParam = createAbstraction<IBuildParam>("BuildParam");

export namespace BuildParam {
    export type Interface = IBuildParam;
}

export interface IBuildParams {
    get(key: string): string | null;
}

export const BuildParams = createAbstraction<IBuildParams>("BuildParams");

export namespace BuildParams {
    export type Interface = IBuildParams;
}

import { createAbstraction } from "@webiny/feature/admin";

export interface IBuildParam {
    key: string;
    value: any;
}

export const BuildParam = createAbstraction<IBuildParam>("BuildParam");

export namespace BuildParam {
    export type Interface = IBuildParam;
}

export interface IBuildParams {
    get<T = any>(key: string): T | null;
}

export const BuildParams = createAbstraction<IBuildParams>("BuildParams");

export namespace BuildParams {
    export type Interface = IBuildParams;
}

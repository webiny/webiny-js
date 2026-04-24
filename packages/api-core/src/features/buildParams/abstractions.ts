import { createAbstraction } from "@webiny/feature/api";

export interface IBuildParam {
    key: string;
    value: any;
}

/** A single build-time configuration parameter. */
export const BuildParam = createAbstraction<IBuildParam>("BuildParam");

export namespace BuildParam {
    export type Interface = IBuildParam;
}

export interface IBuildParams {
    get<T = any>(key: string): T | null;
}

/** Access build-time configuration parameters. */
export const BuildParams = createAbstraction<IBuildParams>("BuildParams");

export namespace BuildParams {
    export type Interface = IBuildParams;
}

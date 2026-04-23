import { createAbstraction } from "@webiny/feature/api";

export interface IMasker {
    mask(value: string): string;
}

export const Masker = createAbstraction<IMasker>("Masker");

export namespace Masker {
    export type Interface = IMasker;
}

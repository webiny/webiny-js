import { createAbstraction } from "@webiny/feature/api";

export interface IMasker {
    /**
     * @param value Value to mask
     * @param mask Masking pattern. The first number represents visible characters from the start, second - from the end.
     */
    mask(value: string, mask?: number[]): string;
}

export const Masker = createAbstraction<IMasker>("Masker");

export namespace Masker {
    export type Interface = IMasker;
}

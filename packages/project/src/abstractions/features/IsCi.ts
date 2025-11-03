import { Abstraction } from "@webiny/di";

interface IIsCi {
    execute(): boolean;
}

export const IsCi = new Abstraction<IIsCi>("IsCi");

export namespace IsCi {
    export type Interface = IIsCi;
}

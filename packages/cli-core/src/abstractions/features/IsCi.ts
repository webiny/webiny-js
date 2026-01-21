import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IIsCi {
    execute(): boolean;
}

export const IsCi = createAbstraction<IIsCi>("IsCi");

export namespace IsCi {
    export type Interface = IIsCi;
}

import { createAbstraction } from "@webiny/feature/api";

export interface ITimer {
    getRemainingSeconds(): number;
}

export const Timer = createAbstraction<ITimer>("Timer");

export namespace Timer {
    export type Interface = ITimer;
}

import { createAbstraction } from "@webiny/feature/api";

interface IInternalToken {
    readonly value: string;
}

export const InternalToken = createAbstraction<IInternalToken>("BackgroundTasks/InternalToken");

export namespace InternalToken {
    export type Interface = IInternalToken;
}

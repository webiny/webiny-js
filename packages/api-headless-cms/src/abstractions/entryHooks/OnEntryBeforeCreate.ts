import { Abstraction } from "@webiny/di";

export interface IOnEntryBeforeCreate {
    execute(): Promise<void>;
}

export const OnEntryBeforeCreate = new Abstraction<IOnEntryBeforeCreate>("OnEntryBeforeCreate");

export namespace OnEntryBeforeCreate {
    export type Interface = IOnEntryBeforeCreate;
}

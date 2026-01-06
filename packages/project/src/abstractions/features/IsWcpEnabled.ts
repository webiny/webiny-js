import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IIsWcpEnabled {
    execute(): Promise<boolean>;
}

export const IsWcpEnabled = createAbstraction<IIsWcpEnabled>("IsWcpEnabled");

export namespace IsWcpEnabled {
    export type Interface = IIsWcpEnabled;
}

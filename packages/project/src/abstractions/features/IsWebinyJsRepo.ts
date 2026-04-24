import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IIsWebinyJsRepo {
    execute(): boolean;
}

export const IsWebinyJsRepo = createAbstraction<IIsWebinyJsRepo>("IsWebinyJsRepo");

export namespace IsWebinyJsRepo {
    export type Interface = IIsWebinyJsRepo;
}

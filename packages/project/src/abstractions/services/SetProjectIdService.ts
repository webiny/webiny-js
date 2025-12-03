import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface ISetProjectIdServiceOptions {
    force?: boolean;
}

interface ISetProjectIdService {
    execute(id: string, options: ISetProjectIdServiceOptions): Promise<void>;
}

export const SetProjectIdService = createAbstraction<ISetProjectIdService>("SetProjectIdService");

export namespace SetProjectIdService {
    export type Interface = ISetProjectIdService;
    export type Options = ISetProjectIdServiceOptions;
}

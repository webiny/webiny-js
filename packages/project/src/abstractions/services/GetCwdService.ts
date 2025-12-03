import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetCwdService {
    execute(): string;
}

export const GetCwdService = createAbstraction<IGetCwdService>("GetCwdService");

export namespace GetCwdService {
    export type Interface = IGetCwdService;
}

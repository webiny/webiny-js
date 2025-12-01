import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGetArgvService {
    execute<T = Record<string, any>>(): T;
}

export const GetArgvService = createAbstraction<IGetArgvService>("GetArgvService");

export namespace GetArgvService {
    export type Interface = IGetArgvService;
}

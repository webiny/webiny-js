import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IGetNpxVersionService {
    execute(): string;
}

export const GetNpxVersionService =
    createAbstraction<IGetNpxVersionService>("GetNpxVersionService");

export namespace GetNpxVersionService {
    export type Interface = IGetNpxVersionService;
}

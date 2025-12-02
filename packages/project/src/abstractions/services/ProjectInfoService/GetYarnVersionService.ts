import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IGetYarnVersionService {
    execute(): string;
}

export const GetYarnVersionService =
    createAbstraction<IGetYarnVersionService>("GetYarnVersionService");

export namespace GetYarnVersionService {
    export type Interface = IGetYarnVersionService;
}

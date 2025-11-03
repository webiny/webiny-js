import { Abstraction } from "@webiny/di";

interface IGetNpmVersion {
    execute(): string;
}

export const GetNpmVersionService = new Abstraction<IGetNpmVersion>("GetNpmVersion");

export namespace GetNpmVersionService {
    export type Interface = IGetNpmVersion;
}

import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IGetNpmVersion {
    execute(): string;
}

export const GetNpmVersionService = createAbstraction<IGetNpmVersion>("GetNpmVersion");

export namespace GetNpmVersionService {
    export type Interface = IGetNpmVersion;
}

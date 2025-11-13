import { createAbstraction } from "~/abstractions/createAbstraction.js";

interface IGetIsCiService {
    execute(): boolean;
}

export const GetIsCiService = createAbstraction<IGetIsCiService>("GetIsCiService");

export namespace GetIsCiService {
    export type Interface = IGetIsCiService;
}

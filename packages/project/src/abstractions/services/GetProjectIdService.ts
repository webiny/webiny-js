import { createAbstraction } from "~/abstractions/createAbstraction.js";

type IGetProjectIdServiceResult = string | null;

interface IGetProjectIdService {
    execute(): Promise<IGetProjectIdServiceResult>;
}

export const GetProjectIdService = createAbstraction<IGetProjectIdService>("GetProjectIdService");

export namespace GetProjectIdService {
    export type Interface = IGetProjectIdService;
    export type Result = IGetProjectIdServiceResult;
}

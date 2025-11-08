import { Abstraction } from "@webiny/di";

type IGetProjectIdServiceResult = string | null;

interface IGetProjectIdService {
    execute(): Promise<IGetProjectIdServiceResult>;
}

export const GetProjectIdService = new Abstraction<IGetProjectIdService>("GetProjectIdService");

export namespace GetProjectIdService {
    export type Interface = IGetProjectIdService;
    export type Result = IGetProjectIdServiceResult;
}

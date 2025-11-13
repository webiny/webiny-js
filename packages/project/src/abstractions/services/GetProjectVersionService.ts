import { createAbstraction } from "~/abstractions/createAbstraction.js";

type IGetProjectVersionServiceResult = string;

interface IGetProjectVersionService {
    execute(cwd?: string): IGetProjectVersionServiceResult;
}

export const GetProjectVersionService = createAbstraction<IGetProjectVersionService>(
    "GetProjectVersionService"
);

export namespace GetProjectVersionService {
    export type Interface = IGetProjectVersionService;
    export type Result = IGetProjectVersionServiceResult;
}

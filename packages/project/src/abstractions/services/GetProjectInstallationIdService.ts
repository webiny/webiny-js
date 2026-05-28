import { createAbstraction } from "~/abstractions/createAbstraction.js";

type IGetProjectInstallationIdServiceResult = string | null;

interface IGetProjectInstallationIdService {
    execute(): IGetProjectInstallationIdServiceResult;
}

export const GetProjectInstallationIdService = createAbstraction<IGetProjectInstallationIdService>(
    "GetProjectInstallationIdService"
);

export namespace GetProjectInstallationIdService {
    export type Interface = IGetProjectInstallationIdService;
    export type Result = IGetProjectInstallationIdServiceResult;
}

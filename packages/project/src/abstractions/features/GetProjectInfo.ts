import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type ProjectInfoService } from "~/abstractions/services/ProjectInfoService/index.js";

type GetProjectInfoParams = void;
type GetProjectInfoResult = ProjectInfoService.Result;

interface IGetProjectInfo {
    execute(params: GetProjectInfoParams): Promise<GetProjectInfoResult>;
}

export const GetProjectInfo = createAbstraction<IGetProjectInfo>("GetProjectInfo");

export namespace GetProjectInfo {
    export type Interface = IGetProjectInfo;

    export type Params = GetProjectInfoParams;

    export type Result = GetProjectInfoResult;
}

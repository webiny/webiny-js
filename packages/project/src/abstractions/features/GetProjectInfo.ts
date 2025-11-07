import { Abstraction } from "@webiny/di";
import { type ProjectInfoService } from "~/abstractions/services/ProjectInfoService/index.js";

type GetProjectInfoParams = void;
type GetProjectInfoResult = ProjectInfoService.Result;

interface IGetProjectInfo {
    execute(params: GetProjectInfoParams): Promise<GetProjectInfoResult>;
}

export const GetProjectInfo = new Abstraction<IGetProjectInfo>("GetProjectInfo");

export namespace GetProjectInfo {
    export type Interface = IGetProjectInfo;

    export type Params = GetProjectInfoParams;

    export type Result = GetProjectInfoResult;
}

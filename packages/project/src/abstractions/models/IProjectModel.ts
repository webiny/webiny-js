import { type IPathModel, type IPathModelDto } from "./IPathModel.js";

export interface IProjectModelDto {
    name: string;
    version: string;
    paths: {
        webinyConfigFile: IPathModelDto;
        webinyConfigBaseFile: IPathModelDto;
        rootFolder: IPathModelDto;
        dotWebinyFolder: IPathModelDto;
        workspaceFolder: IPathModelDto;
        localPulumiStateFilesFolder: IPathModelDto;
        tsConfigFile: IPathModelDto;
    };
}

export interface IProjectModel {
    name: string;
    version: string;
    paths: {
        webinyConfigFile: IPathModel;
        webinyConfigBaseFile: IPathModel;
        rootFolder: IPathModel;
        dotWebinyFolder: IPathModel;
        workspaceFolder: IPathModel;
        localPulumiStateFilesFolder: IPathModel;
        tsConfigFile: IPathModel;
    };

    toDto(): IProjectModelDto;
}

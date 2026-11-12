import { type GetApp } from "~/abstractions/index.js";
import { type IPathModel } from "./IPathModel.js";

export interface IAppModelDto {
    name: GetApp.AppName;
    paths: {
        workspaceFolder: string;
    };
}

export interface IAppModel {
    name: GetApp.AppName;
    paths: {
        workspaceFolder: IPathModel;
    };

    getDisplayName(): string;
}

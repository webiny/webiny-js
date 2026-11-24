import { type IAppModel, type IAppModelDto } from "~/abstractions/models/index.js";
import { type GetApp } from "~/abstractions/index.js";
import { PathModel } from "./PathModel.js";

const DISPLAY_NAME_MAP: Record<GetApp.AppName, string> = {
    core: "Core",
    api: "API",
    admin: "Admin",
    blueGreen: "Blue-Green",
    sync: "Sync"
};

export class AppModel implements IAppModel {
    public readonly name: GetApp.AppName;
    public readonly paths: IAppModel["paths"];

    private constructor(dto: IAppModelDto) {
        this.name = dto.name;
        this.paths = {
            workspaceFolder: PathModel.from(dto.paths.workspaceFolder)
        };
    }

    getDisplayName(): string {
        return DISPLAY_NAME_MAP[this.name];
    }

    static fromDto(dto: IAppModelDto): IAppModel {
        return new AppModel(dto);
    }
}

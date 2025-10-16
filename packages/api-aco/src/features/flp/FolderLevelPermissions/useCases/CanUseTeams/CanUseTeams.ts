import type { ICanUseTeams } from "./ICanUseTeams.js";
import type { IGetWcpGateway } from "~/flp/FolderLevelPermissions/gateways/GetWcpGateway/index.js";

export class CanUseTeams implements ICanUseTeams {
    private getWcpGateway: IGetWcpGateway;

    constructor(getWcpGateway: IGetWcpGateway) {
        this.getWcpGateway = getWcpGateway;
    }

    execute() {
        return this.getWcpGateway.execute().canUseTeams();
    }
}

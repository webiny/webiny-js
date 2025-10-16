import { IGetWcpGateway } from "../../gateways/index.js";
import type { ICanUseTeams } from "./ICanUseTeams.js";

export class CanUseTeams implements ICanUseTeams {
    private getWcpGateway: IGetWcpGateway;

    constructor(getWcpGateway: IGetWcpGateway) {
        this.getWcpGateway = getWcpGateway;
    }

    execute() {
        return this.getWcpGateway.execute().canUseTeams();
    }
}

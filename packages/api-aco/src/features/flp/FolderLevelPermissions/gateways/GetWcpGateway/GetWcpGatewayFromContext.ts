import type { IGetWcpGateway } from "./IGetWcpGateway.js";
import type { AcoContext } from "~/types.js";

export class GetWcpGatewayFromContext implements IGetWcpGateway {
    private context: AcoContext;

    constructor(context: AcoContext) {
        this.context = context;
    }

    execute() {
        return this.context.wcp;
    }
}

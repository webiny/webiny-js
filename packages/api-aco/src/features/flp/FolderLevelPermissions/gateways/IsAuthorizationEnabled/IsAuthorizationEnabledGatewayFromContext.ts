import type { IIsAuthorizationEnabledGateway } from "./IIsAuthorizationEnabledGateway.js";
import type { AcoContext } from "~/types.js";

export class IsAuthorizationEnabledGatewayFromContext implements IIsAuthorizationEnabledGateway {
    private context: AcoContext;

    constructor(context: AcoContext) {
        this.context = context;
    }

    execute() {
        return this.context.security.isAuthorizationEnabled();
    }
}

import type { IGetIdentityGateway } from "./IGetIdentityGateway.js";
import type { AcoContext } from "~/types.js";

export class GetIdentityGatewayFromContext implements IGetIdentityGateway {
    private context: AcoContext;

    constructor(context: AcoContext) {
        this.context = context;
    }

    execute() {
        return this.context.security.getIdentity();
    }
}

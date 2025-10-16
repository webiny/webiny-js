import type { IListPermissionsGateway } from "./IListPermissionsGateway.js";
import type { AcoContext } from "~/types.js";

export class ListPermissionsGatewayFromContext implements IListPermissionsGateway {
    private context: AcoContext;

    constructor(context: AcoContext) {
        this.context = context;
    }

    execute() {
        return this.context.security.listPermissions();
    }
}

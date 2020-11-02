import { Context } from "@webiny/graphql/types";
import { HandlerClientContext } from "@webiny/handler-client/types";

interface PermissionManagerOperation {
    action: string;
    identity: string | null;
    type: string;
}

export class PermissionsManagerClient {
    functionName: string;
    context: Context & HandlerClientContext;

    constructor({ functionName }, context) {
        this.functionName = functionName;
        this.context = context;
    }

    private async invoke(operation: PermissionManagerOperation) {
        return [{ name: "*" }]; // TODO
        const { error, data } = await this.context.handlerClient.invoke({
            name: this.functionName,
            payload: operation
        });

        if (error) {
            throw Error(error);
        }

        return data;
    }

    async getPermissions() {
        const identity = this.context.security.getIdentity();

        return await this.invoke({
            action: "getPermissions",
            identity: identity ? identity.id : null,
            type: identity ? identity.type : "anonymous"
        });
    }
}

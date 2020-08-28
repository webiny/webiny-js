import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";

interface PermissionManagerOperation {
    action: string;
    identity: string | null;
    type: string;
}

export class PermissionsManagerClient {
    functionName: string;
    lambda: LambdaClient;
    context: Context;

    constructor({ functionName }, context) {
        this.functionName = functionName;
        this.context = context;
    }

    private async invoke(operation: PermissionManagerOperation) {
        if (!this.lambda) {
            this.lambda = new LambdaClient({ region: process.env.AWS_REGION });
        }

        const { Payload } = await this.lambda
            .invoke({
                FunctionName: this.functionName,
                Payload: JSON.stringify(operation)
            })
            .promise();

        const { error, data } = JSON.parse(Payload as string);

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

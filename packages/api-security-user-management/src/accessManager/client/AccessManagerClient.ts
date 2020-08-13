import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";

interface AccessManagerOperation {
    action: string;
    identity: string;
    type: string;
}

export class AccessManagerClient {
    accessManagerFunction: string;
    lambda: LambdaClient;
    context: Context;

    constructor({ functionName }, context) {
        this.accessManagerFunction = functionName;
        this.context = context;
    }

    private async invoke(operation: AccessManagerOperation) {
        if (!this.lambda) {
            this.lambda = new LambdaClient({ region: process.env.AWS_REGION });
        }

        const { Payload } = await this.lambda
            .invoke({
                FunctionName: this.accessManagerFunction,
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

        if (!identity) {
            return [];
        }

        return await this.invoke({
            action: "getPermissions",
            identity: identity.id,
            type: identity.type
        });
    }
}

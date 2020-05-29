import LambdaClient from "aws-sdk/clients/lambda";
import { Action } from "../types";

interface SettingsManagerOperation {
    action: Action;
    key: string;
    data?: { [key: string]: any };
}

export class SettingsManagerClient {
    settingsManagerFunction: string;
    lambda: LambdaClient;

    constructor({ functionName }) {
        this.settingsManagerFunction = functionName;
    }

    private async invoke(operation: SettingsManagerOperation) {
        if (!this.lambda) {
            this.lambda = new LambdaClient({ region: process.env.AWS_REGION });
        }

        const { Payload } = await this.lambda
            .invoke({
                FunctionName: this.settingsManagerFunction,
                Payload: JSON.stringify(operation)
            })
            .promise();

        const { error, data } = JSON.parse(Payload as string);

        if (error) {
            throw Error(error);
        }

        return data;
    }

    async getSettings(key: string) {
        return await this.invoke({ action: "getSettings", key });
    }

    async saveSettings(key: string, data) {
        await this.invoke({ action: "saveSettings", key, data });
    }

    async deleteSettings(key: string) {
        await this.invoke({ action: "deleteSettings", key });
    }
}

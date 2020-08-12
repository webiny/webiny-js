import LambdaClient from "aws-sdk/clients/lambda";
import { Action } from "../types";

interface SettingsManagerOperation {
    action: Action;
    key: string;
    data?: { [key: string]: any };
}

class SettingsManagerClientCache {
    data?: { [key: string]: any };
    constructor() {
        this.data = {};
    }

    set(key, data) {
        this.data[key] = data;
    }

    get(key) {
        return this.data[key];
    }

    flush(key) {
        delete this.data[key];
    }
}

export class SettingsManagerClient {
    settingsManagerFunction: string;
    lambda: LambdaClient;
    cache: SettingsManagerClientCache;
    constructor({ functionName }) {
        this.settingsManagerFunction = functionName;
        this.cache = new SettingsManagerClientCache();
    }

    private async invoke(operation: SettingsManagerOperation) {
        const cached = this.cache.get(operation.key);
        if (cached) {
            return cached;
        }

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

        this.cache.set(operation.key, data);

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

    getCache() {
        return this.cache;
    }
}

import { CmsContentModel, CmsContext, CmsDataManager } from "@webiny/api-headless-cms/types";
import LambdaClient from "aws-sdk/clients/lambda";
import { Action } from "../types";

interface DataManagerOperation {
    environment?: string;
    action: Action;
    [key: string]: any;
}

export class DataManagerClient implements CmsDataManager {
    dataManagerFunction: string;
    context: CmsContext;

    constructor({ dataManagerFunction, context }) {
        this.dataManagerFunction = dataManagerFunction;
        this.context = context;
    }

    private async invokeDataManager(operation: DataManagerOperation) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        await Lambda.invoke({
            FunctionName: this.dataManagerFunction,
            InvocationType: "Event",
            Payload: JSON.stringify(operation)
        }).promise();
    }

    async generateRevisionIndexes({ revision }: any) {
        await this.invokeDataManager({
            environment: this.context.cms.getEnvironment().id,
            action: "generateRevisionIndexes",
            contentModel: revision.contentModel.modelId,
            revision: revision.id
        });
    }

    async deleteRevisionIndexes({ revision }: any) {
        await this.invokeDataManager({
            environment: this.context.cms.getEnvironment().id,
            action: "deleteRevisionIndexes",
            contentModel: revision.contentModel.modelId,
            revision: revision.id
        });
    }

    async generateContentModelIndexes({ contentModel }: { contentModel: CmsContentModel }) {
        return await this.invokeDataManager({
            environment: this.context.cms.getEnvironment().id,
            action: "generateContentModelIndexes",
            contentModel: contentModel.modelId
        });
    }

    async deleteEnvironment({ environment }: { environment: string }) {
        return await this.invokeDataManager({
            action: "deleteEnvironment",
            environment
        });
    }

    async copyEnvironment({ copyFrom, copyTo }: { copyFrom: string; copyTo: string }) {
        return await this.invokeDataManager({
            action: "copyEnvironment",
            copyFrom,
            copyTo
        });
    }
}

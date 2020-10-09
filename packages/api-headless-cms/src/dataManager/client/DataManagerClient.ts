import { CmsContentModel, CmsContext, CmsDataManager } from "@webiny/api-headless-cms/types";
import { Action } from "../types";
import { HandlerClientContext } from "@webiny/handler-client/types";

interface DataManagerOperation {
    environment?: string;
    action: Action;
    [key: string]: any;
}

export class DataManagerClient implements CmsDataManager {
    dataManagerFunction: string;
    context: CmsContext & HandlerClientContext;

    constructor({ dataManagerFunction, context }) {
        this.dataManagerFunction = dataManagerFunction;
        this.context = context;
    }

    private async invokeDataManager(operation: DataManagerOperation) {
        await this.context.handlerClient.invoke({
            name: this.dataManagerFunction,
            payload: operation,
            await: false
        });
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

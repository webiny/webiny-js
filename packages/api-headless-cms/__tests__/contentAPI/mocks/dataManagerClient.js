import { generateRevisionIndexes } from "../../src/dataManager/handler/generateRevisionIndexes";
import { deleteRevisionIndexes } from "../../src/dataManager/handler/deleteRevisionIndexes";
import { generateContentModelIndexes } from "../../src/dataManager/handler/generateContentModelIndexes";
import { deleteEnvironmentData } from "../../src/dataManager/handler/deleteEnvironmentData";
import { copyEnvironment } from "../../src/dataManager/handler/copyEnvironment";

export class DataManagerClient {
    constructor(context) {
        this.context = context;
    }

    async generateRevisionIndexes({ revision }) {
        await generateRevisionIndexes({
            context: this.context,
            revision: revision.id,
            contentModel: revision.contentModel.modelId
        });
    }

    async deleteRevisionIndexes({ revision }) {
        await deleteRevisionIndexes({
            context: this.context,
            revision: revision.id,
            contentModel: revision.contentModel.modelId
        });
    }

    async generateContentModelIndexes({ contentModel }) {
        await generateContentModelIndexes({
            contentModel: contentModel.modelId,
            context: this.context
        });
    }

    async deleteEnvironment({ environment }) {
        await deleteEnvironmentData({ environment, context: this.context });
    }

    async copyEnvironment({ copyFrom, copyTo }) {
        await copyEnvironment({ context: this.context, copyFrom, copyTo });
    }
}

export const dataManagerPlugins = () => {
    return {
        type: "context",
        name: "context-cms-data-manager",
        apply(context) {
            if (!context.cms) {
                context.cms = {};
            }
            context.cms.dataManager = new DataManagerClient(context);
        }
    };
};

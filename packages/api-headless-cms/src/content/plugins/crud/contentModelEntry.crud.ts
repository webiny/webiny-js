import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContentModelEntryContextType,
    CmsContentModelEntryType,
    CmsContext,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import * as utils from "@webiny/api-headless-cms/utils";
import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        const { db } = context;

        const contentModelEntry: CmsContentModelEntryContextType = {
            get: async id => {
                const [response] = await db.read<CmsContentModelEntryType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelEntryPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    throw new Error(`CMS Content model "${id}" not found.`);
                }
                return response.find(() => true);
            },
            list: async () => {
                const [response] = await db.read<CmsContentModelEntryType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelEntryPk(context), SK: { $gt: " " } }
                });

                return response;
            },
            create: async (data, createdBy) => {
                await utils.checkBaseContentModelEntryPermissions(context, "w");
                // TODO need to create validation for model entry create
                const modelDataJson: any = {
                    ...data
                };

                const { modelId } = modelDataJson;

                // we need to check if content model exists
                // but we do not need the data from it
                try {
                    await context.cms.models.get(modelDataJson.modelId);
                } catch (ex) {
                    throw new NotFoundError(`There is no content model "${modelId}".`);
                }

                const id = mdbid();
                const model: CmsContentModelEntryType = {
                    id,
                    ...modelDataJson,
                    createdOn: new Date(),
                    changedOn: null,
                    createdBy
                };

                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: utils.createContentModelEntryPk(context),
                        SK: id,
                        TYPE: DbItemTypes.CMS_CONTENT_MODEL_ENTRY,
                        ...model
                    }
                });
                return model;
            },
            update: async (id, data) => {
                const permissions = await utils.checkBaseContentModelEntryPermissions(context, "w");
                const model = await context.cms.modelEntries.get(id);
                utils.checkOwnership(context, permissions, model);

                // TODO create validation for model entry update
                const modelDataJson: any = {
                    ...data
                };

                const updatedModel: CmsContentModelEntryType = {
                    ...modelDataJson,
                    changedOn: new Date()
                };

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelEntryPk(context), SK: id },
                    data: updatedModel
                });

                return {
                    ...model,
                    ...updatedModel
                };
            },
            delete: async id => {
                const permissions = await utils.checkBaseContentModelEntryPermissions(context, "w");
                const model = await context.cms.modelEntries.get(id);
                utils.checkOwnership(context, permissions, model);

                await db.delete({
                    ...utils.defaults.db,
                    query: {
                        PK: utils.createContentModelEntryPk(context),
                        SK: id
                    }
                });
            }
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            contentModelEntry
        };
    }
});

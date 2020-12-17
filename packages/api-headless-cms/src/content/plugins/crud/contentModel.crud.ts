import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModelType,
    CmsContentModelContextType,
    CmsContentModelManagerInterface,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import * as utils from "@webiny/api-headless-cms/utils";
import mdbid from "mdbid";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import { contentModelManagerFactory } from "./contentModel/contentModelManagerFactory";
import { CreateContentModelModel, UpdateContentModelModel } from "./contentModel/models";
import { createFieldModels } from "./contentModel/createFieldModels";
import { validateLayout } from "./contentModel/validateLayout";
import { beforeSaveHook } from "./contentModel/beforeSave.hook";
import { afterSaveHook } from "./contentModel/afterSave.hook";
import { beforeDeleteHook } from "./contentModel/beforeDelete.hook";
import { afterDeleteHook } from "./contentModel/afterDelete.hook";
import { beforeCreateHook } from "./contentModel/beforeCreate.hook";
import { afterCreateHook } from "./contentModel/afterCreate.hook";

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-crud",
    async apply(context) {
        const { db } = context;

        const loaders = {
            listModels: new DataLoader(async () => {
                const [models] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: { $gt: " " } }
                });

                return [models];
            })
        };

        // manager per request - something similar to dataloader
        const managers = new Map<string, CmsContentModelManagerInterface<any>>();
        const updateManager = async <T>(
            context: CmsContext,
            model: CmsContentModelType
        ): Promise<CmsContentModelManagerInterface<T>> => {
            const manager = await contentModelManagerFactory(context, model);
            managers.set(model.modelId, manager);
            return (manager as unknown) as CmsContentModelManagerInterface<T>;
        };

        const models: CmsContentModelContextType = {
            async get(id) {
                const permission = await utils.checkBaseContentModelPermissions(context, "r");

                const [response] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    throw new NotFoundError(`CMS Content model "${id}" not found.`);
                }
                const model = response.find(() => true);

                utils.checkOwnership(context, permission, model);

                return model;
            },
            async list() {
                const permission = await utils.checkBaseContentModelPermissions(context, "r");
                const models = await loaders.listModels.load("listModels");
                return models.filter(model => utils.validateOwnership(context, permission, model));
            },
            async create(data, createdBy) {
                await utils.checkBaseContentModelPermissions(context, "w");

                const createdData = new CreateContentModelModel().populate(data);
                await createdData.validate();
                const createdDataJson = await createdData.toJSON();

                const group = await context.cms.groups.get(createdDataJson.group);
                if (!group) {
                    throw new Error(`There is no group "${createdDataJson.group}".`);
                }

                const id = mdbid();
                const model: CmsContentModelType = {
                    ...createdDataJson,
                    id,
                    group: {
                        id: group.id,
                        name: group.name
                    },
                    createdBy,
                    createdOn: new Date().toISOString(),
                    changedOn: new Date().toISOString(),
                    fields: [],
                    layout: []
                };

                await beforeCreateHook(context, model);

                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: utils.createContentModelPk(context),
                        SK: id,
                        TYPE: DbItemTypes.CMS_CONTENT_MODEL,
                        ...model
                    }
                });

                await updateManager(context, model);

                await afterCreateHook(context, model);

                return model;
            },
            async update(id, data) {
                const model = await context.cms.models.get(id);
                const permission = await utils.checkBaseContentModelPermissions(context, "w");
                utils.checkOwnership(context, permission, model);

                const updatedData = new UpdateContentModelModel().populate(data);
                await updatedData.validate();

                const updatedDataJson = await updatedData.toJSON({ onlyDirty: true });
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }
                if (updatedDataJson.group) {
                    const group = await context.cms.groups.get(updatedDataJson.group);
                    if (!group) {
                        throw new NotFoundError(`There is no group "${updatedDataJson.group}".`);
                    }
                    updatedDataJson.group = {
                        id: group.id,
                        name: group.name
                    };
                }
                const updatedFields = await createFieldModels(model, data);
                validateLayout(updatedDataJson, updatedFields);
                const modelData: CmsContentModelType = {
                    ...updatedDataJson,
                    fields: updatedFields,
                    changedOn: new Date().toISOString()
                };

                await beforeSaveHook(context, modelData);

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: id },
                    data: modelData
                });
                await updateManager(context, {
                    ...model,
                    ...modelData
                });

                await afterSaveHook(context);

                return {
                    ...model,
                    ...modelData
                };
            },
            async delete(id) {
                const model = await context.cms.models.get(id);
                const permission = await utils.checkBaseContentModelPermissions(context, "d");
                utils.checkOwnership(context, permission, model);

                await beforeDeleteHook(context, { modelId: model.modelId });

                await db.delete({
                    ...utils.defaults.db,
                    query: {
                        PK: utils.createContentModelPk(context),
                        SK: id
                    }
                });

                await afterDeleteHook(context);

                managers.delete(model.modelId);
            },
            async getManager<T = any>(modelId) {
                if (managers.has(modelId)) {
                    return managers.get(modelId);
                }
                const models = await context.cms.models.list();
                const model = models.find(m => m.modelId === modelId);
                if (!model) {
                    throw new NotFoundError(`There is no content model "${modelId}".`);
                }
                return await updateManager<T>(context, model);
            },
            getManagers: () => managers
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            models,
            getModel: (modelId: string) => {
                return models.getManager(modelId);
            }
        };
    }
});

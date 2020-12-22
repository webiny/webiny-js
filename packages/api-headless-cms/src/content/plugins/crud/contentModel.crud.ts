import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModelType,
    CmsContentModelContextType,
    CmsContentModelManagerInterface,
    DbItemTypes,
    CmsContentModelPermissionType
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

const MANAGE_CM = "cms.manage.contentModel";

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-crud",
    async apply(context) {
        const { db, security } = context;

        const PK_CONTENT_MODEL = () => `${utils.createCmsPK(context)}#CM`;

        const loaders = {
            listModels: new DataLoader(async () => {
                const [models] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: PK_CONTENT_MODEL(), SK: { $gt: " " } }
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

        const checkPermissions = (check: string): Promise<CmsContentModelPermissionType> => {
            return utils.checkPermissions(context, "cms.manage.contentModel", { rwd: check });
        };

        const models: CmsContentModelContextType = {
            async get(id) {
                const permission = await checkPermissions("r");

                const [[model]] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: PK_CONTENT_MODEL(), SK: id }
                });

                utils.checkOwnership(context, permission, model);
                utils.checkModelAccess(context, permission, model);

                if (!model) {
                    throw new NotFoundError(`Content model "${id}" was not found!`);
                }

                return model;
            },
            async list() {
                const permission = await checkPermissions("r");
                const models = await loaders.listModels.load("listModels");
                return models.filter(model => {
                    if (!utils.validateOwnership(context, permission, model)) {
                        return false;
                    }
                    return utils.validateModelAccess(context, permission, model);
                });
            },
            async create(data) {
                await checkPermissions("w");

                const createdData = new CreateContentModelModel().populate(data);
                await createdData.validate();
                const createdDataJson = await createdData.toJSON();

                const group = await context.cms.groups.get(createdDataJson.group);
                if (!group) {
                    throw new NotFoundError(`There is no group "${createdDataJson.group}".`);
                }

                const identity = context.security.getIdentity();
                const id = mdbid();
                const model: CmsContentModelType = {
                    ...createdDataJson,
                    id,
                    group: {
                        id: group.id,
                        name: group.name
                    },
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    },
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    fields: [],
                    layout: []
                };

                await beforeCreateHook(context, model);

                await db.create({
                    ...utils.defaults.db,
                    data: {
                        PK: PK_CONTENT_MODEL(),
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
                await checkPermissions("w");

                // Get a model record; this will also perform ownership validation.
                const model = await context.cms.models.get(id);

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
                    savedOn: new Date().toISOString()
                };

                await beforeSaveHook(context, modelData);

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: PK_CONTENT_MODEL(), SK: id },
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
                await checkPermissions("d");

                const model = await context.cms.models.get(id);

                await beforeDeleteHook(context, { modelId: model.modelId });

                await db.delete({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_CONTENT_MODEL(),
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

import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModelType,
    CmsContentModelContextType,
    CmsContentModelManagerInterface,
    ContentModelManagerPlugin,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import * as utils from "@webiny/api-headless-cms/utils";
import mdbid from "mdbid";

const defaultName = "content-model-manager-default";

const CreateContentModelModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    modelId: string({ validation: validation.create("required,maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    group: string({ validation: validation.create("required,maxLength:255") })
})();

const UpdateContentModelModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    modelId: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    group: string({ validation: validation.create("maxLength:255") })
})();

const contentModelManagerFactory = async (context: CmsContext, model: CmsContentModelType) => {
    const pluginsByType = context.plugins.byType<ContentModelManagerPlugin>(
        "content-model-manager"
    );
    for (const plugin of pluginsByType) {
        const target = Array.isArray(plugin.targetCode) ? plugin.targetCode : [plugin.targetCode];
        if (target.includes(model.modelId) === true && plugin.name !== defaultName) {
            return await plugin.create(context, model);
        }
    }
    const plugin = pluginsByType.find(plugin => plugin.name === defaultName);
    if (!plugin) {
        throw new Error("There is no default plugin to create ContentModelManager");
    }
    return await plugin.create(context, model);
};
export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-crud",
    async apply(context) {
        const { db } = context;

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
                const [response] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            async list() {
                const [response] = await db.read<CmsContentModelType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: { $gt: " " } }
                });
                return response;
            },
            async create(data, createdBy) {
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
                    createdOn: new Date().toISOString()
                };

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
                return model;
            },
            async update(initialModel, data) {
                const updatedData = new UpdateContentModelModel().populate(data);
                await updatedData.validate();

                const updatedDataJson = await updatedData.toJSON({ onlyDirty: true });
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }
                if (updatedDataJson.group) {
                    const group = await context.cms.groups.get(updatedDataJson.group);
                    if (!group) {
                        throw new Error(`There is no group "${updatedDataJson.group}".`);
                    }
                    updatedDataJson.group = {
                        id: group.id,
                        name: group.name
                    };
                }
                const modelData: CmsContentModelType = {
                    ...updatedDataJson,
                    changedOn: new Date().toISOString()
                };
                await db.update({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelPk(context), SK: initialModel.id },
                    data: modelData
                });
                await updateManager(context, {
                    ...initialModel,
                    ...modelData
                });
                return modelData;
            },
            async delete(model) {
                managers.delete(model.modelId);
                return;
            },
            async getManager<T = any>(modelId) {
                if (managers.has(modelId)) {
                    return managers.get(modelId);
                }
                const models = await context.cms.models.list();
                const model = models.find(m => m.modelId === modelId);
                if (!model) {
                    throw new Error(`There is no content model "${modelId}".`);
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

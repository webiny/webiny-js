import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModelType,
    CmsContentModelContextType,
    CmsContentModelManagerInterface,
    ContentModelManagerPlugin,
    DbItemTypes,
    CmsContentModelUpdateInputType,
    CmsContentModelFieldType
} from "@webiny/api-headless-cms/types";
import { validation } from "@webiny/validation";
import * as utils from "@webiny/api-headless-cms/utils";
import mdbid from "mdbid";
import { pipe, object } from "@webiny/commodo";
import { withFields, string, setOnce, onSet, boolean, fields } from "@commodo/fields";
import idValidation from "@webiny/api-headless-cms/content/plugins/models/ContentModel/idValidation";
import { any } from "@webiny/api-headless-cms/content/plugins/models/anyField";

const defaultName = "content-model-manager-default";

const requiredShortString = validation.create("required,maxLength:255");
const shortString = validation.create("maxLength:255");

const CreateContentModelModel = withFields({
    name: string({ validation: requiredShortString }),
    modelId: string({ validation: requiredShortString }),
    description: string({ validation: shortString }),
    group: string({ validation: requiredShortString })
})();

const RendererModel = withFields({
    name: string({ validation: requiredShortString })
})();

const ContentModelFieldModel = withFields({
    id: string({ validation: requiredShortString }),
    fieldId: pipe(
        onSet(value => value && value.trim()),
        setOnce()
    )(string({ validation: idValidation })),
    label: string({ validation: requiredShortString }),
    helpText: string({ validation: shortString }),
    placeholderText: string({ validation: shortString }),
    type: setOnce()(string({ validation: requiredShortString })),
    multipleValues: boolean({ value: false }),
    predefinedValues: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean(),
            values: any({ list: true })
        })()
    }),
    renderer: fields({ instanceOf: RendererModel, validation: shortString }),
    validation: fields({
        list: true,
        value: [],
        instanceOf: withFields({
            name: string({ validation: requiredShortString }),
            message: string({ validation: shortString }),
            settings: object({ value: {} })
        })()
    }),
    settings: object({ value: {} })
})();

const UpdateContentModelModel = withFields({
    name: string({ validation: shortString }),
    modelId: string({ validation: shortString }),
    description: string({ validation: shortString }),
    group: string({ validation: shortString }),
    fields: fields({ instanceOf: ContentModelFieldModel, value: [], list: true }),
    layout: object({ value: [] })
})();

const createUpdatedFields = async (
    model: CmsContentModelType,
    data: CmsContentModelUpdateInputType
): Promise<CmsContentModelFieldType[]> => {
    const fields = [];
    for (const field of data.fields) {
        const fieldData = new ContentModelFieldModel().populate(data);
        await fieldData.validate();

        const obj: CmsContentModelFieldType = {
            id: field.id,
            fieldId: field.fieldId,
            label: field.label,
            helpText: field.helpText,
            multipleValues: field.multipleValues,
            settings: field.settings,
            type: field.type,
            validation: field.validation
        };
        fields.push(obj);
    }
    return fields;
};

const validateLayout = (
    { layout }: CmsContentModelType,
    fields: CmsContentModelFieldType[]
): void => {
    const flatFieldIdList = layout.reduce((acc, id) => {
        return acc.concat(Array.isArray(id) ? id : [id]);
    }, []);
    if (flatFieldIdList.length !== fields.length) {
        throw new Error(
            `There are ${flatFieldIdList.length} IDs in the layout and ${fields.length} in fields, which cannot be - numbers must be the same.`
        );
    }
    for (const field of fields) {
        if (flatFieldIdList.includes(field.id)) {
            continue;
        }
        throw new Error(`Field "${field.id}" is not defined in layout.`);
    }
};
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
                    createdOn: new Date().toISOString(),
                    fields: [],
                    layout: []
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
                const updatedFields = await createUpdatedFields(initialModel, data);
                validateLayout(initialModel, updatedFields);
                const modelData: CmsContentModelType = {
                    ...updatedDataJson,
                    fields: updatedFields,
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

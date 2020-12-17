import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContentModelEntryContextType,
    CmsContentModelEntryCreateInputType,
    CmsContentModelEntryType,
    CmsContentModelType,
    CmsContext,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import * as utils from "../../../utils";
import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import { entryModelValidationFactory } from "./contentModelEntry/entryModelValidationFactory";
import { createElasticSearchParams } from "./contentModelEntry/createElasticSearchParams";

const createElasticSearchData = (model: CmsContentModelEntryType, context: CmsContext) => {
    const values = Object.keys(model.values).reduce((obj: Record<string, any>, key: string) => {
        obj[key] = model.values[key];
        return obj;
    }, {});
    return {
        ...values,
        __type: "cms.entry",
        id: model.id,
        createdOn: model.createdOn,
        savedOn: model.savedOn,
        createdBy: model.createdBy,
        modelId: model.modelId,
        locale: context.cms.getLocale().code
    };
};

const updateElasticSearchData = (model: CmsContentModelEntryType) => {
    const values = Object.keys(model.values).reduce((obj: Record<string, any>, key: string) => {
        obj[key] = model.values[key];
        return obj;
    }, {});
    return {
        ...values,
        savedOn: model.savedOn
    };
};

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        const { db, elasticSearch } = context;

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
            list: async (model: CmsContentModelType, args = {}) => {
                // eslint-disable-next-line
                const searchValues = createElasticSearchParams({
                    model,
                    args,
                    context,
                    onlyOwned: false
                });
                const [response] = await db.read<CmsContentModelEntryType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelEntryPk(context), SK: { $gt: " " } }
                });

                return response;
            },
            create: async (contentModelId, data, createdBy) => {
                await utils.checkBaseContentModelEntryPermissions(context, "w");

                const contentModel = await context.cms.models.get(contentModelId);

                const validation = await entryModelValidationFactory(context, contentModel);

                await validation.validate(data);
                const modelDataJson: CmsContentModelEntryCreateInputType = {
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
                    savedOn: new Date(),
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

                await elasticSearch.create({
                    ...utils.defaults.es(context),
                    id: `CME#${model.id}`,
                    body: createElasticSearchData(model, context)
                });

                return model;
            },
            update: async (id, data) => {
                const permissions = await utils.checkBaseContentModelEntryPermissions(context, "w");

                const existingEntryModel = await context.cms.modelEntries.get(id);

                utils.checkOwnership(context, permissions, existingEntryModel);

                const contentModel = await context.cms.models.get(id);

                const validation = await entryModelValidationFactory(context, contentModel);

                await validation.validate(data);
                const updatedModel: CmsContentModelEntryType = {
                    ...existingEntryModel,
                    values: data.values,
                    savedOn: new Date()
                };

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelEntryPk(context), SK: id },
                    data: updatedModel
                });

                // TODO check if we update only savedOn and values fields
                await elasticSearch.update({
                    ...utils.defaults.es(context),
                    id: `CME#${id}`,
                    body: {
                        doc: updateElasticSearchData(updatedModel)
                    }
                });

                return {
                    ...existingEntryModel,
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

                await elasticSearch.delete({
                    ...utils.defaults.es(context),
                    id: `CME#${id}`
                });
            }
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            contentModelEntry
        };
    }
});

import WebinyError from "@webiny/error";
import { UpgradePlugin } from "@webiny/api-upgrade";
import { CmsContext, CmsModel, CmsModelField } from "~/types";
import { CmsModelPlugin } from "~/plugins";

const assignStorageId = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        const settings = {
            ...(field.settings || {})
        };
        if (settings.fields && Array.isArray(settings.fields) === true) {
            settings.fields = assignStorageId(settings.fields);
        }
        return {
            ...field,
            storageId: field.fieldId,
            settings
        };
    });
};

export const createUpgrade = (): UpgradePlugin<CmsContext> => {
    return {
        type: "api-upgrade",
        version: "5.33.0",
        app: "headless-cms",
        apply: async context => {
            const { security, plugins, cms } = context;

            const pluginModels = plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);

            const isPluginModel = (model: CmsModel): boolean => {
                return pluginModels.some(m => m.contentModel.modelId === model.modelId);
            };
            /**
             * We need to be able to access all data.
             */
            security.disableAuthorization();
            try {
                /**
                 * We need all the models that are not plugin models.
                 */
                const models = (await cms.listModels()).filter(model => {
                    return isPluginModel(model) === false;
                });

                /**
                 * Then we need to go into each of the model fields and add the storageId, which is the same as the fieldId
                 */
                const updatedModels = models.map(model => {
                    return {
                        ...model,
                        fields: assignStorageId(model.fields)
                    };
                });
                /**
                 * And update all the models
                 */
                for (const model of updatedModels) {
                    await cms.updateModelDirect({
                        original: models.find(m => m.modelId === model.modelId) as CmsModel,
                        model
                    });
                }
            } catch (ex) {
                throw new WebinyError(
                    `Could not finish the 5.33.0 upgrade. Please contact Webiny team on Slack and share the error.`,
                    "UPGRADE_ERROR",
                    {
                        ex: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data
                        }
                    }
                );
            } finally {
                /**
                 * Always enable the security after all the code runs.
                 */
                security.enableAuthorization();
            }
        }
    };
};

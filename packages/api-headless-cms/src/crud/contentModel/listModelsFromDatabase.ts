import type { CmsModel, HeadlessCmsStorageOperations } from "~/types/index.js";
import {
    ensurePluralApiName,
    ensureSingularApiName
} from "~/crud/contentModel/compatibility/modelApiName.js";
import { ensureTypeTag } from "./ensureTypeTag.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { I18NLocale } from "@webiny/api-core/types/i18n.js";

interface Params {
    storageOperations: HeadlessCmsStorageOperations;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const listModelsFromDatabase = async (params: Params): Promise<CmsModel[]> => {
    const { storageOperations, getTenant, getLocale } = params;
    const models = await storageOperations.models.list({
        where: {
            tenant: getTenant().id,
            locale: getLocale().code
        }
    });
    return models.map(model => {
        return {
            ...model,
            tags: ensureTypeTag(model),
            tenant: model.tenant || getTenant().id,
            locale: model.locale || getLocale().code,
            /**
             * TODO: remove in v5.36.0
             * This is for backward compatibility while migrations are not yet executed.
             */
            singularApiName: ensureSingularApiName(model),
            pluralApiName: ensurePluralApiName(model)
        };
    });
};

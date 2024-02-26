import { CmsModel, HeadlessCmsStorageOperations } from "~/types";
import {
    ensurePluralApiName,
    ensureSingularApiName
} from "~/crud/contentModel/compatibility/modelApiName";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { ensureTypeTag } from "./ensureTypeTag";

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

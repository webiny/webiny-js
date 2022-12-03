import {
    AdminSettings,
    AdminSettingsContext,
    AdminSettingsService,
    AdminSettingsVariant
} from "~/types";
import { StorageOperationsService } from "~/storage/types";
import WebinyError from "@webiny/error";

interface Params {
    storageOperations: StorageOperationsService;
    context: AdminSettingsContext;
}
export const createSettingsService = async (params: Params): Promise<AdminSettingsService> => {
    const { storageOperations, context } = params;

    const getTenant = (): string => {
        return context.tenancy.getCurrentTenant().id;
    };

    const getSettings = async (variant: AdminSettingsVariant): Promise<AdminSettings | null> => {
        try {
            return await storageOperations.settings.getSettings(variant);
        } catch (ex) {
            throw new WebinyError(ex.message, "NOT_FOUND", ex.data);
        }
    };

    return {
        getSettings: async () => {
            try {
                const result = await getSettings(getTenant());
                if (result) {
                    return result;
                }
            } catch (ex) {
                if (ex.code !== "NOT_FOUND") {
                    throw ex;
                }
            }
            return await getSettings("default");
        }
    };
};

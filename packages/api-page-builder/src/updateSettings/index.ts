import DefaultSettingsModel from "../utils/models/DefaultSettings.model";
import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { PbContext, Settings, SettingsStorageOperations } from "~/types";
import { createStorageOperations } from "~/graphql/crud/storageOperations";
import { SettingsStorageOperationsProviderPlugin } from "~/plugins/SettingsStorageOperationsProviderPlugin";

export interface HandlerArgs {
    data: Settings;
}

export interface HandlerResponse {
    data: Settings;
    error: {
        message: string;
        code?: string;
        data?: Record<string, any>;
    };
}

/**
 * Updates system default settings, for all tenants and all locales. Of course, these values can later be overridden
 * via the settings UI in the Admin app. But it's with these settings that every new tenant / locale will start off.
 */
export default (): HandlerPlugin<PbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        try {
            /**
             * We need to initialize storage operations for settings to be able to get and store the data.
             */
            const storageOperations = await createStorageOperations<SettingsStorageOperations>(
                context,
                SettingsStorageOperationsProviderPlugin.type
            );
            const { invocationArgs: args } = context;
            let original = await storageOperations.get({
                tenant: false,
                locale: false,
                where: {
                    type: "default"
                }
            });

            if (!original) {
                const input: any = {
                    type: "default",
                    tenant: null,
                    locale: null
                };
                await storageOperations.create({
                    input,
                    settings: {
                        ...input
                    }
                });
                original = {
                    ...input
                };
            }

            const defaultSettingModel = new DefaultSettingsModel();
            defaultSettingModel.populate(original).populate(args.data);

            await defaultSettingModel.validate();

            const updateSettingsData = await defaultSettingModel.toJSON();

            const settings = {
                ...original,
                ...updateSettingsData
            };

            await storageOperations.update({
                tenant: false,
                locale: false,
                input: updateSettingsData,
                original,
                settings
            });

            const data = {
                ...settings
            };
            delete data.locale;
            delete data.tenant;
            delete data.type;
            return {
                data,
                error: null
            };
        } catch (ex) {
            return {
                data: null,
                error: {
                    message: ex.message,
                    code: ex.code || "UNKNOWN",
                    data: {
                        ...(ex.data || {})
                    }
                }
            };
        }
    }
});

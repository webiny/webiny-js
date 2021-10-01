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

            const settingsParams: { type: string; tenant: false; locale: false } = {
                type: "default",
                tenant: false,
                locale: false
            };

            let original = await storageOperations.get({
                where: settingsParams
            });

            if (!original) {
                const input: any = settingsParams;
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
                ...updateSettingsData,
                ...settingsParams
            };

            await storageOperations.update({
                input: updateSettingsData,
                original,
                settings
            });

            delete settings.locale;
            delete settings.tenant;
            delete settings.type;
            return {
                data: settings,
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

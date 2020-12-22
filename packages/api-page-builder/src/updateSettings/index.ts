import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";
import DefaultSettingsModel from "@webiny/api-page-builder/utils/models/DefaultSettings.model";
import defaults from "@webiny/api-page-builder/utils/defaults";
import { DefaultSettings } from "@webiny/api-page-builder/types";

export type HandlerArgs = {
    data: DefaultSettings;
};

export type HandlerResponse = {
    data: DefaultSettings;
    error: {
        message: string;
    };
};

const PK = "PB#SETTINGS";
const SK = "default";

/**
 * Updates system default settings, for all tenants and all locales. Of course, these values can later be overridden
 * via the settings UI in the Admin app. But it's with these settings that every new tenant / locale will start off.
 */
export default (): HandlerPlugin<DbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        try {
            const { invocationArgs: args, db } = context;
            let [[existingSettingsData]] = await db.read({
                ...defaults.db,
                query: { PK, SK }
            });

            if (!existingSettingsData) {
                await db.create({
                    ...defaults.db,
                    data: { PK, SK }
                });

                existingSettingsData = {};
            }

            const defaultSettingModel = new DefaultSettingsModel();
            defaultSettingModel.populate(existingSettingsData).populate(args.data);

            await defaultSettingModel.validate();

            const updateSettingsData = await defaultSettingModel.toJSON();
            await db.update({ ...defaults.db, query: { PK, SK }, data: updateSettingsData });

            return { data: updateSettingsData, error: null };
        } catch (e) {
            return {
                data: null,
                error: {
                    message: e.message
                }
            };
        }
    }
});

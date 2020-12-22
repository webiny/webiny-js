import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";
import { SettingsModel } from "@webiny/api-page-builder/utils/models";
import defaults from "@webiny/api-page-builder/utils/defaults";

export type HandlerArgs = {
    data: {
        prerendering: {
            app: {
                url: string;
            };
            storage: {
                name: string;
            };
        };
    };
};

export type HandlerResponse = {
    data: Record<string, any>;
    error: {
        code: string;
        message: string;
        data: Record<string, any>;
    };
};

const PK = "PB#SETTINGS";
const SK = "default";

export default (): HandlerPlugin<DbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context) {
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

            const updateSettingsModel = new SettingsModel();
            updateSettingsModel.populate(existingSettingsData).populate(args.data);

            await updateSettingsModel.validate();

            const updateSettingsData = await updateSettingsModel.toJSON();
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

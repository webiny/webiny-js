import { HandlerPlugin } from "@webiny/handler/types";
import { applyContextPlugins } from "@webiny/graphql";
import { Action } from "../types";

interface ExecuteAction {
    action: Action;
    key: string;
    data?: { [key: string]: any };
}

async function executeAction({ action, key, data }: ExecuteAction, driver) {
    const options = { query: { key, deleted: false } };
    switch (action) {
        case "getSettings":
            const settings = await driver.findOne({ name: "Settings", options });
            return settings.data;
        case "saveSettings":
            await driver.update([{ name: "Settings", ...options, data }]);
            return true;
        case "deleteSettings":
            await driver.delete([{ name: "Settings", ...options }]);
            return true;
    }
}

export default (): HandlerPlugin => ({
    type: "handler",
    name: "handler-settings-manager",
    async handle({ args, context }) {
        const [event] = args;

        await applyContextPlugins(context);

        try {
            const data = await executeAction(event, context.commodo.driver);
            return { error: false, data };
        } catch (err) {
            console.log(err);
            return {
                error: {
                    message: err.message
                },
                data: null
            };
        }
    }
});

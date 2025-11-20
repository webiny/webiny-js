import { defineApiExtension } from "@webiny/project/defineExtension";
import { SettingsBeforeUpdateHandler } from "~/features/settings/UpdateSettings/index.js";

export const SettingsBeforeUpdate = defineApiExtension({
    type: "Settings/SettingsBeforeUpdate",
    description: "Add custom logic to be executed before settings are updated.",
    abstraction: SettingsBeforeUpdateHandler
});

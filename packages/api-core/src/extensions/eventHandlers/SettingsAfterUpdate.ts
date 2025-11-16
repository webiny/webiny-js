import {defineApiExtension} from "@webiny/project/defineExtension";
import { SettingsAfterUpdateHandler } from "~/features/settings/UpdateSettings/index.js";

export const SettingsAfterUpdate = defineApiExtension({
    type: "Settings/SettingsAfterUpdate",
    description: "Add custom logic to be executed after settings are updated.",
    abstraction: SettingsAfterUpdateHandler
});

import { defineApiExtension } from "@webiny/project/defineExtension";
import { SettingsAfterDeleteHandler } from "~/features/settings/DeleteSettings/index.js";

export const SettingsAfterDelete = defineApiExtension({
    type: "Settings/SettingsAfterDelete",
    description: "Add custom logic to be executed after settings are deleted.",
    abstraction: SettingsAfterDeleteHandler
});

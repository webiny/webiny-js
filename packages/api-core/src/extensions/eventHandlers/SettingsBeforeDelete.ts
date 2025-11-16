import {defineApiExtension} from "@webiny/project/defineExtension";
import { SettingsBeforeDeleteHandler } from "~/features/settings/DeleteSettings/index.js";

export const SettingsBeforeDelete = defineApiExtension({
    type: "Settings/SettingsBeforeDelete",
    description: "Add custom logic to be executed before settings are deleted.",
    abstraction: SettingsBeforeDeleteHandler
});

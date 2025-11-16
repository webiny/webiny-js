import {defineApiExtension} from "@webiny/project/defineExtension";
import { SystemInstalledHandler } from "~/features/system/InstallSystem/index.js";

export const SystemInstalled = defineApiExtension({
    type: "System/SystemInstalled",
    description: "Add custom logic to be executed after the system is installed.",
    abstraction: SystemInstalledHandler
});

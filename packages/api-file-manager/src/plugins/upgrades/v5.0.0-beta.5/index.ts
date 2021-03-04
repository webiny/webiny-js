import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { FileManagerContext } from "../../../types";

const plugin: UpgradePlugin<FileManagerContext> = {
    type: "api-upgrade",
    app: "file-manager",
    version: "5.0.0-beta.5",
    async apply(context) {
        console.log("");
    }
};

export default plugin;

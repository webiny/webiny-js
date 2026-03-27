import { createFeature } from "@webiny/feature/api";
import { UpgradeCommandHandler } from "./UpgradeCommandHandler.js";
import { UpgradeCommand } from "./UpgradeCommand.js";

export const UpgradeCommandFeature = createFeature({
    name: "Command/Upgrade",
    register(container) {
        container.register(UpgradeCommand).inSingletonScope();
        container.register(UpgradeCommandHandler);
    }
});

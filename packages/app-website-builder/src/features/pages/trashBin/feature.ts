import { createFeature } from "@webiny/feature/admin";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { WbTrashBinListGateway } from "./WbTrashBinListGateway.js";
import { WbTrashBinDeleteGateway } from "./WbTrashBinDeleteGateway.js";
import { WbTrashBinRestoreGateway } from "./WbTrashBinRestoreGateway.js";
import { WbTrashBinBulkActionGateway } from "./WbTrashBinBulkActionGateway.js";

export const WbTrashBinFeature = createFeature({
    name: "WebsiteBuilder/Pages/TrashBin",
    register(container) {
        container.register(WbTrashBinListGateway).inSingletonScope();
        container.register(WbTrashBinDeleteGateway).inSingletonScope();
        container.register(WbTrashBinRestoreGateway).inSingletonScope();
        container.register(WbTrashBinBulkActionGateway).inSingletonScope();

        TrashBinFeature.register(container);
    }
});

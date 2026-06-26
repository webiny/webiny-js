import { createFeature } from "@webiny/feature/admin";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { ListDeletedEntriesFeature } from "~/features/contentEntry/listDeletedEntries/feature.js";
import { RestoreFromTrashFeature } from "~/features/contentEntry/restoreFromTrash/feature.js";
import { PermanentlyDeleteEntryFeature } from "~/features/contentEntry/permanentlyDeleteEntry/feature.js";
import { CmsTrashBinItemMapper } from "./CmsTrashBinItemMapper.js";
import {
    CmsTrashBinListGatewayAdapter,
    CmsTrashBinDeleteGatewayAdapter,
    CmsTrashBinRestoreGatewayAdapter,
    CmsTrashBinBulkActionGatewayAdapter
} from "./CmsTrashBinGatewayAdapter.js";

export const CmsTrashBinFeature = createFeature({
    name: "CmsContentEntry/TrashBin",
    register(container) {
        ListDeletedEntriesFeature.register(container);
        RestoreFromTrashFeature.register(container);
        PermanentlyDeleteEntryFeature.register(container);

        container.register(CmsTrashBinItemMapper).inSingletonScope();

        container.register(CmsTrashBinListGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinDeleteGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinRestoreGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinBulkActionGatewayAdapter).inSingletonScope();

        TrashBinFeature.register(container);
    }
});

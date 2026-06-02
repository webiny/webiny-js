import { createFeature } from "@webiny/feature/admin";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/feature.js";
import { CmsTrashBinListGateway } from "./CmsTrashBinListGateway.js";
import { CmsTrashBinDeleteGateway } from "./CmsTrashBinDeleteGateway.js";
import { CmsTrashBinRestoreGateway } from "./CmsTrashBinRestoreGateway.js";
import { CmsTrashBinBulkActionGateway } from "./CmsTrashBinBulkActionGateway.js";
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
        container.register(CmsTrashBinListGateway).inSingletonScope();
        container.register(CmsTrashBinDeleteGateway).inSingletonScope();
        container.register(CmsTrashBinRestoreGateway).inSingletonScope();
        container.register(CmsTrashBinBulkActionGateway).inSingletonScope();
        container.register(CmsTrashBinItemMapper).inSingletonScope();

        container.register(CmsTrashBinListGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinDeleteGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinRestoreGatewayAdapter).inSingletonScope();
        container.register(CmsTrashBinBulkActionGatewayAdapter).inSingletonScope();

        TrashBinFeature.register(container);
    }
});

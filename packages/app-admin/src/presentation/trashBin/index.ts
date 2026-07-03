export { TrashBinFeature } from "./feature.js";
export {
    TrashBinPresenter,
    TrashBinListGateway,
    TrashBinDeleteGateway,
    TrashBinRestoreGateway,
    TrashBinBulkActionGateway,
    type ITrashBinPresenter,
    type ITrashBinPresenterConfig,
    type ITrashBinViewModel,
    type ITrashBinActions,
    type ITrashBinListGateway,
    type ITrashBinListGatewayParams,
    type ITrashBinListGatewayResult,
    type ITrashBinDeleteGateway,
    type ITrashBinRestoreGateway,
    type ITrashBinBulkActionGateway,
    type ITrashBinBulkActionParams,
    type ITrashBinBulkActionResult,
    type TrashBinItem,
    type TrashBinIdentity,
    type TrashBinLocation
} from "./abstractions.js";
export { TrashBinOverlay } from "./components/TrashBinOverlay.js";
export { TrashBinConfigs } from "./components/TrashBinConfigs.js";
export { TrashBinListConfig, useTrashBinListConfig } from "./configs/index.js";
export {
    useTrashBinPresenter,
    useTrashBinItem,
    useDeleteTrashBinItem,
    useRestoreTrashBinItem
} from "./hooks/index.js";

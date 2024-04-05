import { createEmptyTrashBinByModelTask } from "./emptyTrashBinByModel";
import { createEmptyTrashBinsTask } from "./emptyTrashBins";

export const createEntriesTasks = () => {
    return [createEmptyTrashBinByModelTask(), createEmptyTrashBinsTask()];
};

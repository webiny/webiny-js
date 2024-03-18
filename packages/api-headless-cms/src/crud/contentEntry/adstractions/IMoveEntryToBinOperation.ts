import { CmsEntryStorageOperationsMoveToBinParams, CmsModel } from "~/types";

export interface IMoveEntryToBinOperation {
    execute: (model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) => Promise<void>;
}

import { createFeature } from "@webiny/feature/api";
import { BlockActionIfModelDisabledImplementation } from "./BlockActionIfModelDisabled.js";
import { BlockModelActionOnEntryBeforeCreate } from "./handlers/BlockModelActionOnEntryBeforeCreate.js";
import { BlockModelActionOnEntryRevisionBeforeCreate } from "./handlers/BlockModelActionOnEntryRevisionBeforeCreate.js";
import { BlockModelActionOnEntryBeforeUpdate } from "./handlers/BlockModelActionOnEntryBeforeUpdate.js";
import { BlockModelActionOnEntryBeforeUnpublish } from "./handlers/BlockModelActionOnEntryBeforeUnpublish.js";
import { BlockModelActionOnEntryBeforePublish } from "./handlers/BlockModelActionOnEntryBeforePublish.js";
import { BlockModelActionOnEntryBeforeRepublish } from "./handlers/BlockModelActionOnEntryBeforeRepublish.js";
import { BlockModelActionOnEntryBeforeRestoreFromBin } from "./handlers/BlockModelActionOnEntryBeforeRestoreFromBin.js";
import { BlockModelActionOnEntryBeforeMove } from "./handlers/BlockModelActionOnEntryBeforeMove.js";
import { BlockModelActionOnModelBeforeUpdate } from "./handlers/BlockModelActionOnModelBeforeUpdate.js";
import { BlockModelActionOnModelBeforeCreateFrom } from "./handlers/BlockModelActionOnModelBeforeCreateFrom.js";

export const DisableModelFeature = createFeature({
    name: "DisableModel",
    register(container) {
        container.register(BlockActionIfModelDisabledImplementation);

        container.register(BlockModelActionOnEntryBeforeCreate);
        container.register(BlockModelActionOnEntryRevisionBeforeCreate);
        container.register(BlockModelActionOnEntryBeforeUpdate);
        container.register(BlockModelActionOnEntryBeforeUnpublish);
        container.register(BlockModelActionOnEntryBeforePublish);
        container.register(BlockModelActionOnEntryBeforeRepublish);
        container.register(BlockModelActionOnEntryBeforeRestoreFromBin);
        container.register(BlockModelActionOnEntryBeforeMove);

        container.register(BlockModelActionOnModelBeforeUpdate);
        container.register(BlockModelActionOnModelBeforeCreateFrom);
    }
});

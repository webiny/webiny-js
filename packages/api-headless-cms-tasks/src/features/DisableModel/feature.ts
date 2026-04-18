import { createFeature } from "@webiny/feature/api";
import { BlockActionIfModelDisabled as Abstraction } from "./abstractions.js";
import { BlockActionIfModelDisabled } from "./BlockActionIfModelDisabled.js";
import type { HeadlessCmsFullyDeleteModel } from "~/types.js";
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

export interface LegacyDeps {
    isModelBeingDeleted: HeadlessCmsFullyDeleteModel["isModelBeingDeleted"];
}

export const DisableModelFeature = createFeature<LegacyDeps>({
    name: "DisableModel",
    register(container, params) {
        // Register the blocking service
        container.registerInstance(
            Abstraction,
            new BlockActionIfModelDisabled(params.isModelBeingDeleted)
        );

        // Register entry event handlers
        container.register(BlockModelActionOnEntryBeforeCreate);
        container.register(BlockModelActionOnEntryRevisionBeforeCreate);
        container.register(BlockModelActionOnEntryBeforeUpdate);
        container.register(BlockModelActionOnEntryBeforeUnpublish);
        container.register(BlockModelActionOnEntryBeforePublish);
        container.register(BlockModelActionOnEntryBeforeRepublish);
        container.register(BlockModelActionOnEntryBeforeRestoreFromBin);
        container.register(BlockModelActionOnEntryBeforeMove);

        // Register model event handlers
        container.register(BlockModelActionOnModelBeforeUpdate);
        container.register(BlockModelActionOnModelBeforeCreateFrom);
    }
});

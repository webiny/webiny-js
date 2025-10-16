import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { FolderAfterUpdateHandler } from "~/features/folders/UpdateFolder/index.js";
import { UpdateFlpOnFolderUpdatedHandler } from "./UpdateFlpOnFolderUpdatedHandler.js";
import { UpdateFlpUseCase } from "../UpdateFlp/abstractions.js";
import type { ITasksContextObject } from "@webiny/tasks";

interface LegacyDeps {
    tasks: ITasksContextObject;
}

export const UpdateFlpOnFolderUpdatedFeature = createFeature({
    name: "UpdateFlpOnFolderUpdated",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderAfterUpdateHandler, () => {
            const updateFlpUseCase = container.resolve(UpdateFlpUseCase);
            return new UpdateFlpOnFolderUpdatedHandler(updateFlpUseCase, deps.tasks);
        });
    }
});

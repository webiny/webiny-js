import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { DeleteFlpOnFolderDeletedHandler } from "./DeleteFlpOnFolderDeletedHandler.js";
import { DeleteFlpUseCase } from "../DeleteFlp/abstractions.js";
import { FolderAfterDeleteHandler } from "~/features/folders/DeleteFolder/index.js";
import type { ITasksContextObject } from "@webiny/tasks";

interface LegacyDeps {
    tasks: ITasksContextObject;
}

export const DeleteFlpOnFolderDeletedFeature = createFeature({
    name: "DeleteFlpOnFolderDeleted",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderAfterDeleteHandler, () => {
            const deleteFlpUseCase = container.resolve(DeleteFlpUseCase);
            return new DeleteFlpOnFolderDeletedHandler(deleteFlpUseCase, deps.tasks);
        });
    }
});

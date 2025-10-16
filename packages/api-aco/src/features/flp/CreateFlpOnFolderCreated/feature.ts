import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { CreateFlpOnFolderCreatedHandler } from "./CreateFlpOnFolderCreatedHandler.js";
import { CreateFlpUseCase } from "../CreateFlp/abstractions.js";
import { FolderAfterCreateHandler } from "~/features/folders/CreateFolder/index.js";
import type { ITasksContextObject } from "@webiny/tasks";

interface LegacyDeps {
    tasks: ITasksContextObject;
}

export const CreateFlpOnFolderCreatedFeature = createFeature({
    name: "CreateFlpOnFolderCreated",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(FolderAfterCreateHandler, () => {
            const createFlpUseCase = container.resolve(CreateFlpUseCase);
            const HandlerClass = CreateFlpOnFolderCreatedHandler as any;
            return new HandlerClass(createFlpUseCase, deps.tasks);
        });
    }
});

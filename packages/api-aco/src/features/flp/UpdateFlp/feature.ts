import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { UpdateFlpUseCase } from "./UpdateFlpUseCase.js";
import { UpdateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";
import { FolderModel } from "~/domain/folder/abstractions.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

export const UpdateFlpFeature = createFeature({
    name: "UpdateFlp",
    register(container: Container) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new UpdateFlpUseCase(
                container.resolve(AcoFlpCrud),
                container.resolve(ListFoldersUseCase),
                container.resolve(FolderModel),
                container.resolve(UpdateEntryUseCase),
                container.resolve(IdentityContext)
            );
        });
    }
});

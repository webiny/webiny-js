import { createFeature } from "@webiny/feature/api";
import { ListFolderAccessUseCase } from "./ListFolderAccessUseCase.js";
import { ListEntryAccessUseCase } from "./ListEntryAccessUseCase.js";
import { ListUserFolderAccessUseCase } from "./ListUserFolderAccessUseCase.js";
import { UserFolderCandidates } from "./UserFolderCandidates.js";
import { GetUserFolderAccessUseCase } from "./GetUserFolderAccessUseCase.js";
import { GetUserEntryAccessUseCase } from "./GetUserEntryAccessUseCase.js";

export const ListFolderAccessFeature = createFeature({
    name: "Aco/ListFolderAccess",
    register(container) {
        container.register(ListFolderAccessUseCase);
        container.register(ListEntryAccessUseCase);
        container.register(ListUserFolderAccessUseCase);
        container.register(GetUserFolderAccessUseCase);
        container.register(GetUserEntryAccessUseCase);
        // Storages with an index of grants by target narrow it with a decorator.
        container.register(UserFolderCandidates);
    }
});

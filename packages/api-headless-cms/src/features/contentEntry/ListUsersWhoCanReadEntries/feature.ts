import { createFeature } from "@webiny/feature/api";
import { ListUsersWhoCanReadEntriesUseCase } from "./ListUsersWhoCanReadEntriesUseCase.js";

export const ListUsersWhoCanReadEntriesFeature = createFeature({
    name: "ListUsersWhoCanReadEntries",
    register(container) {
        container.register(ListUsersWhoCanReadEntriesUseCase);
    }
});

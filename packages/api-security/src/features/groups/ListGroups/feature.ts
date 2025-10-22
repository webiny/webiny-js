import { createFeature } from "@webiny/feature/api";
import { ListGroupsUseCaseImpl } from "./ListGroupsUseCase.js";

export const ListGroupsFeature = createFeature({
    name: "ListGroups",
    register(container) {
        container.register(ListGroupsUseCaseImpl);
    }
});

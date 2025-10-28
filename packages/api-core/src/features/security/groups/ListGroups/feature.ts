import { createFeature } from "@webiny/feature/api";
import { ListGroupsUseCase } from "./ListGroupsUseCase.js";

export const ListGroupsFeature = createFeature({
    name: "ListGroups",
    register(container) {
        container.register(ListGroupsUseCase);
    }
});

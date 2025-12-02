import { createFeature } from "@webiny/feature/api";
import { ListUsersUseCase } from "./ListUsersUseCase.js";

export const ListUsersFeature = createFeature({
    name: "ListUsers",
    register(container) {
        container.register(ListUsersUseCase);
    }
});

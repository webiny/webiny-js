import { createFeature } from "@webiny/feature/api";
import { AdminUsersStorageOperations } from "./AdminUsersStorageOperations.js";

export const AdminUsersApiCoreDdbFeature = createFeature({
    name: "ApiCoreDdb/AdminUsers",
    register: container => {
        container.register(AdminUsersStorageOperations).inSingletonScope();
    }
});

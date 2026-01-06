import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleAfterUpdateHandler } from "~/features/security/roles/UpdateRole/index.js";

export const RoleAfterUpdate = defineApiExtension({
    type: "Security/RoleAfterUpdate",
    description: "Add custom logic to be executed after a role is updated.",
    abstraction: RoleAfterUpdateHandler
});

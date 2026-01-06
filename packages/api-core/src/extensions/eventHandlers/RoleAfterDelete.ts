import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleAfterDeleteHandler } from "~/features/security/roles/DeleteRole/index.js";

export const RoleAfterDelete = defineApiExtension({
    type: "Security/RoleAfterDelete",
    description: "Add custom logic to be executed after a role is deleted.",
    abstraction: RoleAfterDeleteHandler
});

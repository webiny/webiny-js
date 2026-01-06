import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleBeforeUpdateHandler } from "~/features/security/roles/UpdateRole/index.js";

export const RoleBeforeUpdate = defineApiExtension({
    type: "Security/RoleBeforeUpdate",
    description: "Add custom logic to be executed before a role is updated.",
    abstraction: RoleBeforeUpdateHandler
});

import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleBeforeDeleteHandler } from "~/features/security/roles/DeleteRole/index.js";

export const RoleBeforeDelete = defineApiExtension({
    type: "Security/RoleBeforeDelete",
    description: "Add custom logic to be executed before a role is deleted.",
    abstraction: RoleBeforeDeleteHandler
});

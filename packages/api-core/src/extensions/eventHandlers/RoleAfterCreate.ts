import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleAfterCreateHandler } from "~/features/security/roles/CreateRole/index.js";

export const RoleAfterCreate = defineApiExtension({
    type: "Security/RoleAfterCreate",
    description: "Add custom logic to be executed after a role is created.",
    abstraction: RoleAfterCreateHandler
});

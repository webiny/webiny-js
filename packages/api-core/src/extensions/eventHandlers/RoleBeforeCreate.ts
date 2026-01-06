import { defineApiExtension } from "@webiny/project/defineExtension";
import { RoleBeforeCreateHandler } from "~/features/security/roles/CreateRole/index.js";

export const RoleBeforeCreate = defineApiExtension({
    type: "Security/RoleBeforeCreate",
    description: "Add custom logic to be executed before a role is created.",
    abstraction: RoleBeforeCreateHandler
});

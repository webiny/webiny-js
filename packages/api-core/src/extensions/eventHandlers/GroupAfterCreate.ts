import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupAfterCreateHandler } from "~/features/security/groups/CreateGroup/index.js";

export const GroupAfterCreate = defineApiExtension({
    type: "Security/GroupAfterCreate",
    description: "Add custom logic to be executed after a group is created.",
    abstraction: GroupAfterCreateHandler
});

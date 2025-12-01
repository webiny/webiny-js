import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupBeforeCreateHandler } from "~/features/security/groups/CreateGroup/index.js";

export const GroupBeforeCreate = defineApiExtension({
    type: "Security/GroupBeforeCreate",
    description: "Add custom logic to be executed before a group is created.",
    abstraction: GroupBeforeCreateHandler
});

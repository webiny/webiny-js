import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupBeforeUpdateHandler } from "~/features/security/groups/UpdateGroup/index.js";

export const GroupBeforeUpdate = defineApiExtension({
    type: "Security/GroupBeforeUpdate",
    description: "Add custom logic to be executed before a group is updated.",
    abstraction: GroupBeforeUpdateHandler
});

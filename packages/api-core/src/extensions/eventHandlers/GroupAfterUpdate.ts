import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupAfterUpdateHandler } from "~/features/security/groups/UpdateGroup/index.js";

export const GroupAfterUpdate = defineApiExtension({
    type: "Security/GroupAfterUpdate",
    description: "Add custom logic to be executed after a group is updated.",
    abstraction: GroupAfterUpdateHandler
});

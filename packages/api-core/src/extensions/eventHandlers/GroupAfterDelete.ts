import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupAfterDeleteHandler } from "~/features/security/groups/DeleteGroup/index.js";

export const GroupAfterDelete = defineApiExtension({
    type: "Security/GroupAfterDelete",
    description: "Add custom logic to be executed after a group is deleted.",
    abstraction: GroupAfterDeleteHandler
});

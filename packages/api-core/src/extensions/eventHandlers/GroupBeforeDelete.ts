import { defineApiExtension } from "@webiny/project/defineExtension";
import { GroupBeforeDeleteHandler } from "~/features/security/groups/DeleteGroup/index.js";

export const GroupBeforeDelete = defineApiExtension({
    type: "Security/GroupBeforeDelete",
    description: "Add custom logic to be executed before a group is deleted.",
    abstraction: GroupBeforeDeleteHandler
});

import { defineApiExtension } from "@webiny/project/defineExtension";
import { UserBeforeDeleteHandler } from "~/features/users/DeleteUser/index.js";

export const UserBeforeDelete = defineApiExtension({
    type: "User/UserBeforeDelete",
    description: "Add custom logic to be executed before a user is deleted.",
    abstraction: UserBeforeDeleteHandler
});

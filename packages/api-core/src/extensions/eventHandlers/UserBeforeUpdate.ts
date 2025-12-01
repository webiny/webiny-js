import { defineApiExtension } from "@webiny/project/defineExtension";
import { UserBeforeUpdateHandler } from "~/features/users/UpdateUser/index.js";

export const UserBeforeUpdate = defineApiExtension({
    type: "User/UserBeforeUpdate",
    description: "Add custom logic to be executed before a user is updated.",
    abstraction: UserBeforeUpdateHandler
});

import { defineApiExtension } from "@webiny/project/defineExtension";
import { UserAfterCreateHandler } from "~/features/users/CreateUser/index.js";

export const UserAfterCreate = defineApiExtension({
    type: "User/UserAfterCreate",
    description: "Add custom logic to be executed after a user is created.",
    abstraction: UserAfterCreateHandler
});

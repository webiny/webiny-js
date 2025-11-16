import {defineApiExtension} from "@webiny/project/defineExtension";
import { UserAfterUpdateHandler } from "~/features/users/UpdateUser/index.js";

export const UserAfterUpdate = defineApiExtension({
    type: "User/UserAfterUpdate",
    description: "Add custom logic to be executed after a user is updated.",
    abstraction: UserAfterUpdateHandler
});

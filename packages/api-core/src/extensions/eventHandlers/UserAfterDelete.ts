import {defineApiExtension} from "@webiny/project/defineExtension";
import { UserAfterDeleteHandler } from "~/features/users/DeleteUser/index.js";

export const UserAfterDelete = defineApiExtension({
    type: "User/UserAfterDelete",
    description: "Add custom logic to be executed after a user is deleted.",
    abstraction: UserAfterDeleteHandler
});

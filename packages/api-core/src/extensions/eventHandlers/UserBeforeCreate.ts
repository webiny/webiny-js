import {defineApiExtension} from "@webiny/project/defineExtension";
import { UserBeforeCreateHandler } from "~/features/users/CreateUser/index.js";

export const UserBeforeCreate = defineApiExtension({
    type: "User/UserBeforeCreate",
    description: "Add custom logic to be executed before a user is created.",
    abstraction: UserBeforeCreateHandler
});

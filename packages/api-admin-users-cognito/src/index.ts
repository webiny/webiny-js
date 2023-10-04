import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { subscribeToEvents } from "~/subscribeToEvents";

export default () => {
    return new ContextPlugin<AdminUsersContext>(async context => {
        subscribeToEvents(context);
    });
};

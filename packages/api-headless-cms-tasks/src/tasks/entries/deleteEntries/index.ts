import { createDeleteEntriesControllerTask } from "./deleteEntriesControllerTask";
import { createDeleteEntriesProcessEntriesTask } from "./deleteEntriesProcessEntriesTask";

export const createDeleteEntries = () => {
    return [createDeleteEntriesControllerTask(), createDeleteEntriesProcessEntriesTask()];
};

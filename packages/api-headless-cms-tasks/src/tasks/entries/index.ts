import { createDeleteEntries } from "./deleteEntries";

export const createEntriesTasks = () => {
    return [createDeleteEntries()];
};

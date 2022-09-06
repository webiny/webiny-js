import { createEntriesContext } from "./entries";
import { createFoldersContext } from "./folders";

import { Folders, FoldersConfig } from "~/types";

export const createContext = async (config: FoldersConfig): Promise<Folders> => {
    const entriesContext = await createEntriesContext(config);
    const folderContext = await createFoldersContext(config);

    return {
        ...entriesContext,
        ...folderContext
    };
};

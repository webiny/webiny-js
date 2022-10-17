import { createFoldersContext } from "./folders";
import { createLinksContext } from "./links";

import { Folders, FoldersConfig } from "~/types";

export const createContext = async (config: FoldersConfig): Promise<Folders> => {
    const linksContext = await createLinksContext(config);
    const folderContext = await createFoldersContext(config);

    return {
        ...linksContext,
        ...folderContext
    };
};

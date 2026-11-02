import type { Container } from "@webiny/di";
import { registerNoFolderList } from "./noFolders/NoFolders.js";
import { registerNoFolderToDelete } from "./noFolders/NoFolderToDelete.js";

/** Registers the folder use cases the "delete model and entries" task resolves. */
export const registerNoFolders = (container: Container) => {
    registerNoFolderList(container);
    registerNoFolderToDelete(container);
};

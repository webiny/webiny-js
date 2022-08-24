import { ContextPlugin } from "@webiny/api";

import { createFolders } from "./context";
import graphqlPlugins from "./graphql";

import { FoldersContext, FoldersStorageOperations } from "./types";

export const createFoldersContext = (foldersOperations: FoldersStorageOperations) => {
    return new ContextPlugin<FoldersContext>(async context => {
        context.folders = await createFolders(foldersOperations);
    });
};

export const createFoldersGraphQL = () => {
    return new ContextPlugin<FoldersContext>(context => {
        context.plugins.register(graphqlPlugins);
    });
};

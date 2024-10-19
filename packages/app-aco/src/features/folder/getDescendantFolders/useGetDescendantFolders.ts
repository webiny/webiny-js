import { useCallback, useContext } from "react";
import { GetDescendantFolders } from "./GetDescendantFolders";
import { FoldersContext } from "~/contexts/folders";

export const useGetDescendantFolders = () => {
    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useCreateFolder must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const getDescendantFolders = useCallback(
        (id: string) => {
            const instance = GetDescendantFolders.instance(type);
            return instance.execute({ id });
        },
        [type]
    );

    return {
        getDescendantFolders
    };
};

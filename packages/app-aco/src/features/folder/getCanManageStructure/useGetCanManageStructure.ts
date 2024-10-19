import { useCallback, useContext } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersContext } from "~/contexts/folders";
import { GetCanManageStructure } from "./GetCanManageStructure";

export const useGetCanManageStructure = () => {
    const { canUseFolderLevelPermissions } = useWcp();

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useGetCanManageContent must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const canManageStructure = useCallback(
        (id: string) => {
            const instance = GetCanManageStructure.instance(type, canUseFolderLevelPermissions());
            return instance.execute(id);
        },
        [type, canUseFolderLevelPermissions]
    );

    return {
        canManageStructure
    };
};

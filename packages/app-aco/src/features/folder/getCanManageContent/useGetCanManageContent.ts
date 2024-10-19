import { useCallback, useContext } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersContext } from "~/contexts/folders";
import { GetCanManageContent } from "./GetCanManageContent";

export const useGetCanManageContent = () => {
    const { canUseFolderLevelPermissions } = useWcp();

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useGetCanManageContent must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const canManageContent = useCallback(
        (id: string) => {
            const instance = GetCanManageContent.instance(type, canUseFolderLevelPermissions());
            return instance.execute(id);
        },
        [type, canUseFolderLevelPermissions]
    );

    return {
        canManageContent
    };
};

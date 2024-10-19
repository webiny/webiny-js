import { useCallback, useContext } from "react";
import { useWcp } from "@webiny/app-wcp";
import { FoldersContext } from "~/contexts/folders";
import { GetCanManagePermissions } from "./GetCanManagePermissions";

export const useGetCanManagePermissions = () => {
    const { canUseFolderLevelPermissions } = useWcp();

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useGetCanManagePermissions must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const canManagePermissions = useCallback(
        (id: string) => {
            const instance = GetCanManagePermissions.instance(type, canUseFolderLevelPermissions());
            return instance.execute(id);
        },
        [type, canUseFolderLevelPermissions]
    );

    return {
        canManagePermissions
    };
};

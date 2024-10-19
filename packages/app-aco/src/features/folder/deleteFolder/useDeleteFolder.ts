import { useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { DeleteFolderGqlGateway } from "./DeleteFolderGqlGateway";
import { DeleteFolderParams } from "./IDeleteFolderUseCase";
import { DeleteFolder } from "./DeleteFolder";
import { FoldersContext } from "~/contexts/folders";

export const useDeleteFolder = () => {
    const client = useApolloClient();
    const gateway = new DeleteFolderGqlGateway(client);

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const deleteFolder = useCallback(
        (params: DeleteFolderParams) => {
            const instance = DeleteFolder.getInstance(gateway, type);
            return instance.execute(params);
        },
        [type, gateway]
    );

    return {
        deleteFolder
    };
};

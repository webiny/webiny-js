import { useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { UpdateFolderGqlGateway } from "./UpdateFolderGqlGateway";
import { UpdateFolder } from "./UpdateFolder";
import { UpdateFolderParams } from "./IUpdateFolderUseCase";
import { FoldersContext } from "~/contexts/folders";

export const useUpdateFolder = () => {
    const client = useApolloClient();
    const gateway = new UpdateFolderGqlGateway(client);

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useUpdateFolder must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const updateFolder = useCallback(
        (params: UpdateFolderParams) => {
            const instance = UpdateFolder.instance(type, gateway);
            return instance.execute(params);
        },
        [type, gateway]
    );

    return {
        updateFolder
    };
};

import { useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { CreateFolderGqlGateway } from "./CreateFolderGqlGateway";
import { CreateFolderParams } from "./ICreateFolderUseCase";
import { CreateFolder } from "./CreateFolder";
import { FoldersContext } from "~/contexts/folders";

export const useCreateFolder = () => {
    const client = useApolloClient();
    const gateway = new CreateFolderGqlGateway(client);

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useCreateFolder must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const createFolder = useCallback(
        (params: CreateFolderParams) => {
            const instance = CreateFolder.instance(type, gateway);
            return instance.execute(params);
        },
        [type, gateway]
    );

    return {
        createFolder
    };
};

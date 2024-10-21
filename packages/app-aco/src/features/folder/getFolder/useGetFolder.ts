import { useCallback, useContext } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { GetFolderGqlGateway } from "./GetFolderGqlGateway";
import { GetFolderParams } from "./IGetFolderUseCase";
import { GetFolder } from "./GetFolder";
import { FoldersContext } from "~/contexts/folders";

export const useGetFolder = () => {
    const client = useApolloClient();
    const gateway = new GetFolderGqlGateway(client);

    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useGetFolder must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const getFolder = useCallback(
        (params: GetFolderParams) => {
            const instance = GetFolder.instance(type, gateway);
            return instance.execute(params);
        },
        [type, gateway]
    );

    return {
        getFolder
    };
};

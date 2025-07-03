import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { CreatePageGqlGateway } from "./CreatePageGqlGateway.js";
import { CreateFolderParams } from "./ICreatePageUseCase.js";
import { CreatePage } from "./CreatePage.js";
import { useFoldersType, useGetFolderGraphQLSelection } from "~/hooks";

export const useCreateFolder = () => {
    const client = useApolloClient();
    const type = useFoldersType();
    const fields = useGetFolderGraphQLSelection();
    const gateway = new CreatePageGqlGateway(client, fields);

    const createFolder = useCallback(
        (params: CreateFolderParams) => {
            const instance = CreatePage.getInstance(type, gateway);
            return instance.execute(params);
        },
        [type, gateway]
    );

    return {
        createFolder
    };
};

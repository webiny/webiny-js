import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { DeletePageGqlGateway } from "./DeletePageGqlGateway.js";
import { type DeletePageParams } from "./IDeletePageUseCase.js";
import { DeletePage } from "./DeletePage.js";

export const useDeletePage = () => {
    const client = useApolloClient();
    const gateway = new DeletePageGqlGateway(client);

    const deletePage = useCallback(
        (params: DeletePageParams) => {
            const instance = DeletePage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        deletePage
    };
};

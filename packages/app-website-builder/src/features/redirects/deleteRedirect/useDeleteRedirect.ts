import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { DeleteRedirectGqlGateway } from "./DeleteRedirectGqlGateway.js";
import { type DeleteRedirectParams } from "./IDeleteRedirectUseCase.js";
import { DeleteRedirect } from "./DeleteRedirect.js";

export const useDeleteRedirect = () => {
    const client = useApolloClient();
    const gateway = new DeleteRedirectGqlGateway(client);

    const deleteRedirect = useCallback(
        (params: DeleteRedirectParams) => {
            const instance = DeleteRedirect.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        deleteRedirect
    };
};

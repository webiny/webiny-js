import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { MoveRedirectGqlGateway } from "~/features/redirects/moveRedirect/MoveRedirectGqlGateway.js";
import type { MoveRedirectParams } from "~/features/redirects/moveRedirect/IMoveRedirectUseCase.js";
import { MoveRedirect } from "~/features/redirects/moveRedirect/MoveRedirect.js";

export const useMoveRedirect = () => {
    const client = useApolloClient();
    const gateway = new MoveRedirectGqlGateway(client);

    const moveRedirect = useCallback(
        (params: MoveRedirectParams) => {
            const instance = MoveRedirect.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        moveRedirect
    };
};

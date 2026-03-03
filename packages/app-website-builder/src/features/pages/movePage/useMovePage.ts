import { useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";
import { MovePageGqlGateway } from "~/features/pages/movePage/MovePageGqlGateway.js";
import type { MovePageParams } from "~/features/pages/movePage/IMovePageUseCase.js";
import { MovePage } from "~/features/pages/movePage/MovePage.js";

export const useMovePage = () => {
    const client = useApolloClient();
    const gateway = new MovePageGqlGateway(client);

    const movePage = useCallback(
        (params: MovePageParams) => {
            const instance = MovePage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        movePage
    };
};

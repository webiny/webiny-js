import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { MovePageGqlGateway } from "~/features/pages/movePage/MovePageGqlGateway.js";
import type { MovePageParams } from "~/features/pages/movePage/IMovePageUseCase.js";
import { MovePage } from "~/features/pages/movePage/MovePage.js";

export const useMovePage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new MovePageGqlGateway(client, fields);

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

import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { UpdatePageGqlGateway } from "./UpdatePageGqlGateway.js";
import { UpdatePage } from "./UpdatePage.js";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import type { UpdatePageParams } from "~/features/pages/updatePage/IUpdatePageUseCase.js";

export const useUpdatePage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new UpdatePageGqlGateway(client, fields);

    const updatePage = useCallback(
        (params: UpdatePageParams) => {
            const instance = UpdatePage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        updatePage
    };
};

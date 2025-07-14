import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { GetPageGqlGateway } from "~/features/pages/getPage/GetPageGqlGateway.js";
import type { GetPageParams } from "~/features/pages/getPage/IGetPageUseCase.js";
import { GetPage } from "~/features/pages/getPage/GetPage.js";

export const useGetPage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata", "bindings", "elements"]);
    const gateway = new GetPageGqlGateway(client, fields);

    const getPage = useCallback(
        (params: GetPageParams) => {
            const instance = GetPage.getInstance(gateway);
            return instance.useCase.execute(params);
        },
        [gateway]
    );

    return {
        getPage
    };
};

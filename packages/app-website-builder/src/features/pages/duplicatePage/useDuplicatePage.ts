import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { DuplicatePageGqlGateway } from "~/features/pages/duplicatePage/DuplicatePageGqlGateway.js";
import type { DuplicatePageParams } from "~/features/pages/duplicatePage/IDuplicatePageUseCase.js";
import { DuplicatePage } from "~/features/pages/duplicatePage/DuplicatePage.js";

export const useDuplicatePage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new DuplicatePageGqlGateway(client, fields);

    const duplicatePage = useCallback(
        (params: DuplicatePageParams) => {
            const instance = DuplicatePage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        duplicatePage
    };
};

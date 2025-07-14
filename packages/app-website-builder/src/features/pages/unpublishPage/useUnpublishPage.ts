import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { UnpublishPageGqlGateway } from "~/features/pages/unpublishPage/UnpublishPageGqlGateway.js";
import type { UnpublishPageParams } from "~/features/pages/unpublishPage/IUnpublishPageUseCase.js";
import { UnpublishPage } from "~/features/pages/unpublishPage/UnpublishPage.js";

export const useUnpublishPage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new UnpublishPageGqlGateway(client, fields);

    const unpublishPage = useCallback(
        (params: UnpublishPageParams) => {
            const instance = UnpublishPage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        unpublishPage
    };
};

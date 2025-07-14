import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { PublishPage } from "~/features/pages/publishPage/PublishPage.js";
import type { PublishPageParams } from "~/features/pages/publishPage/IPublishPageUseCase.js";
import { PublishPageGqlGateway } from "~/features/pages/publishPage/PublishPageGqlGateway.js";

export const usePublishPage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new PublishPageGqlGateway(client, fields);

    const publishPage = useCallback(
        (params: PublishPageParams) => {
            const instance = PublishPage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        publishPage
    };
};

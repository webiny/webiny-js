import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { UpdateRedirectGqlGateway } from "./UpdateRedirectGqlGateway.js";
import { UpdateRedirect } from "./UpdateRedirect.js";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import type { UpdateRedirectParams } from "~/features/redirects/updateRedirect/IUpdateRedirectUseCase.js";

export const useUpdateRedirect = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new UpdateRedirectGqlGateway(client, fields);

    const updateRedirect = useCallback(
        (params: UpdateRedirectParams) => {
            const instance = UpdateRedirect.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        updateRedirect
    };
};

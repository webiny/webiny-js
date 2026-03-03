import { useCallback } from "react";
import { useApolloClient } from "@apollo/client/react";
import { CreateRedirectGqlGateway } from "./CreateRedirectGqlGateway.js";
import { type CreateRedirectParams } from "./ICreateRedirectUseCase.js";
import { CreateRedirect } from "./CreateRedirect.js";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";

export const useCreateRedirect = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new CreateRedirectGqlGateway(client, fields);

    const createRedirect = useCallback(
        (params: CreateRedirectParams) => {
            const instance = CreateRedirect.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        createRedirect
    };
};

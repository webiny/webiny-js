import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import { ListRedirectsGqlGateway } from "~/features/redirects/loadRedirects/ListRedirectsGqlGateway.js";
import { LoadRedirects } from "~/features/redirects/loadRedirects/LoadRedirects.js";
import type { LoadRedirectsUseCaseParams } from "~/features/redirects/loadRedirects/ILoadRedirectsUseCase.js";

export const useLoadRedirects = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new ListRedirectsGqlGateway(client, fields);

    const loadRedirects = useCallback(
        (params: LoadRedirectsUseCaseParams) => {
            const instance = LoadRedirects.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        loadRedirects
    };
};

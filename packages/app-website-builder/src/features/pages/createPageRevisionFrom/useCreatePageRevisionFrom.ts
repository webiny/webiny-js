import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { CreatePageRevisionFromGqlGateway } from "~/features/pages/createPageRevisionFrom/CreatePageRevisionFromGqlGateway.js";
import type { CreatePageRevisionFromParams } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromUseCase.js";
import { CreatePageRevisionFrom } from "~/features/pages/createPageRevisionFrom/CreatePageRevisionFrom.js";

export const useCreatePageRevisionFrom = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata", "bindings", "elements"]);
    const gateway = new CreatePageRevisionFromGqlGateway(client, fields);

    const createPageRevisionFrom = useCallback(
        (params: CreatePageRevisionFromParams) => {
            const instance = CreatePageRevisionFrom.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        createPageRevisionFrom
    };
};

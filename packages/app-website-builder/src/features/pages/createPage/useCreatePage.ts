import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { CreatePageGqlGateway } from "./CreatePageGqlGateway.js";
import { type CreatePageParams } from "./ICreatePageUseCase.js";
import { CreatePage } from "./CreatePage.js";
import { useGetPageGraphQLFields } from "../getPageModel/index.js";

export const useCreatePage = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata", "bindings", "elements"]);
    const gateway = new CreatePageGqlGateway(client, fields);

    const createPage = useCallback(
        (params: CreatePageParams) => {
            const instance = CreatePage.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        createPage
    };
};

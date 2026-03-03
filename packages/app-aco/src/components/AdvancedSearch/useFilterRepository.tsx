import { useApolloClient } from "@apollo/client/react";
import { filterRepositoryFactory } from "~/components/AdvancedSearch/domain/index.js";

export const useFilterRepository = (namespace: string) => {
    const client = useApolloClient();

    return filterRepositoryFactory.getRepository(client, namespace);
};

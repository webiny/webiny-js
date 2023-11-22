import { useApolloClient } from "@apollo/react-hooks";
import { filterRepositoryFactory } from "~/components/AdvancedSearch/domain";

export const useFilterRepository = (namespace: string) => {
    const client = useApolloClient();

    return filterRepositoryFactory.getRepository(client, namespace);
};

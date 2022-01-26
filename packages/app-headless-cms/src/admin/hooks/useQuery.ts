import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import useCms from "./useCms";
import { DocumentNode } from "graphql";

const useQuery = function (query: DocumentNode, options: Record<string, any> = {}) {
    const { apolloClient } = useCms();

    return apolloUseQuery(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options
    });
};

export default useQuery;

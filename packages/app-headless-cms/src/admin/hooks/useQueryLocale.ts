import useCms from "./useCms";
import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import { DocumentNode } from "graphql";

export const useQueryLocale = function (query: DocumentNode, locale: string, options = {}) {
    const { getApolloClient } = useCms();
    const client = getApolloClient(locale);

    return apolloUseQuery(query, {
        client,
        skip: !client,
        ...options
    });
};

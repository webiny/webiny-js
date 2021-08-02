import { useQuery as apolloUseQuery } from "@apollo/react-hooks";
import useCms from "./useCms";

const useQuery = function (query, options = {}) {
    const { apolloClient } = useCms();

    return apolloUseQuery(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options
    });
};

export default useQuery;

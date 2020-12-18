import { useQuery as apolloUseQuery } from "react-apollo";
import useCms from "./useCms";

const useQuery = function(query, options = {}) {
    const { apolloClient } = useCms();

    return apolloUseQuery(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options
    });
};

export default useQuery;

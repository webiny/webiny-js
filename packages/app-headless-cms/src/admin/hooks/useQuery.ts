import useCms from "./useCms";
import { useQuery as apolloUseQuery } from "react-apollo";

const useQuery = function(query, options = {}) {
    const {
        environments: { apolloClient }
    } = useCms();

    return apolloUseQuery(query, {
        client: apolloClient,
        skip: !apolloClient,
        ...options
    });
};

export default useQuery;

import { useLazyQuery as apolloUseLazyQuery } from "@apollo/react-hooks";
import useCms from "./useCms";

const useLazyQuery = function(query, options = {}) {
    const { apolloClient } = useCms();

    return apolloUseLazyQuery(query, {
        client: apolloClient,
        ...options
    });
};

export default useLazyQuery;

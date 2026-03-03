import useCms from "./useCms.js";
import type { ApolloClient } from "@apollo/client";

const useApolloClient = function (): ApolloClient {
    const { apolloClient } = useCms();

    return apolloClient;
};

export default useApolloClient;

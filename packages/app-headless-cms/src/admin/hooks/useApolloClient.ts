import useCms from "./useCms";
import { ApolloClient } from "apollo-client";

const useApolloClient = function (): ApolloClient<any> {
    const { apolloClient } = useCms();

    return apolloClient;
};

export default useApolloClient;

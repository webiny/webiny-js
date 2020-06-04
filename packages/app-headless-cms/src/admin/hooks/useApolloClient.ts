import useCms from "./useCms";

const useApolloClient = function() {
    const {
        environments: { apolloClient }
    } = useCms();

    return apolloClient;
};

export default useApolloClient;

import useCms from "./useCms";

const useApolloClient = function () {
    const { apolloClient } = useCms();

    return apolloClient;
};

export default useApolloClient;

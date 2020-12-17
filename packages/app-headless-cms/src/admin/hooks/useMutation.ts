import { useMutation as apolloUseMutation } from "react-apollo";
import useCms from "./useCms";

const useMutation = function(mutation, options = {}) {
    const {
        environments: { apolloClient }
    } = useCms();

    return apolloUseMutation(mutation, {
        client: apolloClient,
        ...options
    });
};

export default useMutation;

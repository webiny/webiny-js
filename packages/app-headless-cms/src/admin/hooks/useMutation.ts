import useCms from "./useCms";
import { useMutation as apolloUseMutation } from "react-apollo";

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

import { useMutation as apolloUseMutation } from "@apollo/react-hooks";
import useCms from "./useCms";

const useMutation = function (mutation, options = {}) {
    const { apolloClient } = useCms();

    return apolloUseMutation(mutation, {
        client: apolloClient,
        ...options
    });
};

export default useMutation;

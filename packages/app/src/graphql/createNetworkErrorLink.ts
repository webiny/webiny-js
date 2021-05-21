import { onError } from "apollo-link-error";
import { print } from "graphql/language";
import createErrorOverlay from "./createErrorOverlay";
import { boolean } from "boolean";

export default () => {
    return onError(({ networkError, operation }) => {
        const debug = boolean(process.env.REACT_APP_DEBUG);

        if (networkError && debug) {
            createErrorOverlay({ query: print(operation.query), networkError });
        }
    });
};

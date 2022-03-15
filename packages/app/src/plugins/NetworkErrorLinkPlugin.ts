import { ApolloLinkPlugin } from "./ApolloLinkPlugin";
import { onError } from "apollo-link-error";
import { print } from "graphql/language";
import createErrorOverlay from "./NetworkErrorLinkPlugin/createErrorOverlay";
import { boolean } from "boolean";
import { config as appConfig } from "~/config";

/**
 * This plugin creates an ApolloLink that checks for `NetworkError` and shows an ErrorOverlay in the browser.
 */
export class NetworkErrorLinkPlugin extends ApolloLinkPlugin {
    public override createLink() {
        return onError(({ networkError, operation }) => {
            const debug = appConfig.getKey("DEBUG", boolean(process.env.REACT_APP_DEBUG));

            if (networkError && debug) {
                createErrorOverlay({ query: print(operation.query), networkError });
            }

            // TODO: also print graphQLErrors
        });
    }
}

import { ApolloLink } from "apollo-link";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";

function omitTypename(key: string, value: string): string | undefined {
    return key === "__typename" ? undefined : value;
}

/**
 * This link removes `__typename` from the variables being sent to the API.
 */
export class OmitTypenameLinkPlugin extends ApolloLinkPlugin {
    public override createLink(): ApolloLink {
        return new ApolloLink((operation, forward) => {
            if (operation.variables) {
                operation.variables = JSON.parse(JSON.stringify(operation.variables), omitTypename);
            }
            return forward(operation);
        });
    }
}

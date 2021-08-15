import { ApolloLink } from "apollo-link";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";

/**
 * This link checks for presence of `extensions.console` in the response and logs all items to browser console.
 */
export class ConsoleLinkPlugin extends ApolloLinkPlugin {
    createLink() {
        return new ApolloLink((operation, forward) => {
            const isQuery = operation.query.definitions[0]["operation"] === "query";

            return forward(operation).map(data => {
                if (
                    data.extensions &&
                    Array.isArray(data.extensions.console) &&
                    data.extensions.console.length
                ) {
                    const variables = isQuery
                        ? JSON.stringify(operation.variables)
                        : "{ see request details in the Network tab }";
                    console.groupCollapsed(
                        `Logs for graphQL ${isQuery ? "query" : "mutation"}: %c${
                            operation.operationName || "anonymous operation"
                        } %c${variables}%c`,
                        "color: #fa5a28",
                        "color: #6b6b6b",
                        "color: black"
                    );
                    data.extensions.console.forEach(log => {
                        console[log.method](...log.args);
                    });
                    console.groupEnd();
                }

                return data;
            });
        });
    }
}

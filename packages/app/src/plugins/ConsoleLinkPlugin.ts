import { ApolloLink, Observable } from "@apollo/client";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin.js";
import type { OperationDefinitionNode } from "graphql/language/ast.js";

interface Log {
    args: any[];
    method: "error" | "info" | "log" | "warn";
}

interface FetchResult extends ApolloLink.Result {
    extensions?: {
        console?: Log[];
    };
}

/**
 * This link checks for presence of `extensions.console` in the response and logs all items to browser console.
 */
export class ConsoleLinkPlugin extends ApolloLinkPlugin {
    public override createLink() {
        return new ApolloLink((operation, forward) => {
            const firstDefinition = operation.query.definitions[0] as OperationDefinitionNode;
            const isQuery = firstDefinition["operation"] === "query";

            return new Observable(observer => {
                forward(operation).subscribe({
                    next: (data: FetchResult) => {
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
                            data.extensions.console.forEach((log: Log) => {
                                console[log.method](...log.args);
                            });
                            console.groupEnd();
                        }
                        observer.next(data);
                    },
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer)
                });
            });
        });
    }
}

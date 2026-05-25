import React from "react";
import { onError } from "apollo-link-error";
import { type ServerError } from "apollo-link-http-common";
import { print } from "graphql/language/index.js";
import { toBoolean } from "@webiny/stdlib";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin.js";
import createErrorOverlay from "./NetworkErrorLinkPlugin/createErrorOverlay.js";
import { LocalAwsLambdaTimeoutMessage } from "./NetworkErrorLinkPlugin/LocalAwsLambdaTimeoutMessage.js";
import { config as appConfig } from "~/config.js";
import { ErrorOverlay } from "~/plugins/NetworkErrorLinkPlugin/ErrorOverlay.js";
import { GqlErrorOverlay } from "./NetworkErrorLinkPlugin/GqlErrorOverlay.js";
import type { EventPublisher } from "~/features/eventPublisher/index.js";
import { NetworkErrorEvent } from "~/errors/index.js";

const isLocalAwsLambdaFnInvocationTimeoutError = (error: any): error is ServerError => {
    return error.result && error.result.code === "LOCAL_AWS_LAMBDA_TIMEOUT";
};

/**
 * This plugin creates an ApolloLink that checks for `NetworkError` and shows an ErrorOverlay in the browser.
 */
export class NetworkErrorLinkPlugin extends ApolloLinkPlugin {
    constructor(private getEventPublisher: () => EventPublisher.Interface) {
        super();
    }

    public override createLink() {
        return onError(({ networkError, operation }) => {
            const debug = appConfig.getKey("DEBUG", toBoolean(process.env.REACT_APP_DEBUG));

            if (networkError) {
                // Publish network error event
                const errorType = isLocalAwsLambdaFnInvocationTimeoutError(networkError)
                    ? "timeout"
                    : "network";

                const event = new NetworkErrorEvent({
                    message: networkError.message,
                    operationName: operation.operationName,
                    query: print(operation.query),
                    variables: operation.variables,
                    errorType,
                    statusCode: (networkError as any).statusCode,
                    result: (networkError as any).result
                });

                this.getEventPublisher().publish(event);

                // Keep existing overlay logic for now
                if (debug) {
                    if (isLocalAwsLambdaFnInvocationTimeoutError(networkError)) {
                        createErrorOverlay({
                            element: (
                                <ErrorOverlay
                                    message={<LocalAwsLambdaTimeoutMessage />}
                                    closeable={false}
                                />
                            ),
                            closeable: false
                        });
                        return;
                    }

                    createErrorOverlay({
                        element: (
                            <GqlErrorOverlay
                                query={print(operation.query)}
                                networkError={networkError}
                            />
                        )
                    });
                }
            }

            // TODO: also print graphQLErrors
        });
    }
}

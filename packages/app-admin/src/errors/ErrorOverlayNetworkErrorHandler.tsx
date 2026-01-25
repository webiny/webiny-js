import React from "react";
import createErrorOverlay from "@webiny/app/plugins/NetworkErrorLinkPlugin/createErrorOverlay.js";
import { ErrorOverlay } from "@webiny/app/plugins/NetworkErrorLinkPlugin/ErrorOverlay.js";
import { LocalAwsLambdaTimeoutMessage } from "@webiny/app/plugins/NetworkErrorLinkPlugin/LocalAwsLambdaTimeoutMessage.js";
import { GqlErrorOverlay } from "@webiny/app/plugins/NetworkErrorLinkPlugin/GqlErrorOverlay.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { NetworkErrorEvent, NetworkErrorEventHandler } from "@webiny/app/errors/index.js";

class ErrorOverlayNetworkErrorHandlerImpl implements NetworkErrorEventHandler.Interface {
    private readonly debug: boolean;

    constructor(envConfig: EnvConfig.Interface) {
        this.debug = envConfig.get("debug");
    }

    async handle(event: NetworkErrorEvent): Promise<void> {
        if (!this.debug) {
            return;
        }

        const { errorType, query, message, result } = event.payload;

        if (errorType === "timeout" && result?.code === "LOCAL_AWS_LAMBDA_TIMEOUT") {
            createErrorOverlay({
                element: (
                    <ErrorOverlay message={<LocalAwsLambdaTimeoutMessage />} closeable={false} />
                ),
                closeable: false
            });
            return;
        }

        if (query) {
            createErrorOverlay({
                element: (
                    <GqlErrorOverlay
                        query={query}
                        networkError={{ message, statusCode: event.payload.statusCode } as any}
                    />
                )
            });
        } else {
            createErrorOverlay({
                element: <ErrorOverlay message={message} closeable={true} />
            });
        }
    }
}

export const ErrorOverlayNetworkErrorHandler = NetworkErrorEventHandler.createImplementation({
    implementation: ErrorOverlayNetworkErrorHandlerImpl,
    dependencies: [EnvConfig]
});

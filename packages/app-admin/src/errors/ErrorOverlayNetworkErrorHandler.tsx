import React from "react";
import createErrorOverlay from "@webiny/app/errors/overlay/createErrorOverlay.js";
import { ErrorOverlay } from "@webiny/app/errors/overlay/ErrorOverlay.js";
import { LocalAwsLambdaTimeoutMessage } from "@webiny/app/errors/overlay/LocalAwsLambdaTimeoutMessage.js";
import { GqlErrorOverlay } from "@webiny/app/errors/overlay/GqlErrorOverlay.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { NetworkErrorEvent, NetworkErrorEventHandler } from "@webiny/app/errors/index.js";
import { TenantIsDisabled } from "~/errors/TenantIsDisabled.js";

class ErrorOverlayNetworkErrorHandlerImpl implements NetworkErrorEventHandler.Interface {
    private readonly debug: boolean;

    constructor(envConfig: EnvConfig.Interface) {
        this.debug = envConfig.get("debug");
    }

    async handle(event: NetworkErrorEvent): Promise<void> {
        if (!this.debug) {
            return;
        }

        const { errorType, query, message, code, result } = event.payload;

        if (errorType === "timeout" && result?.code === "LOCAL_AWS_LAMBDA_TIMEOUT") {
            createErrorOverlay({
                element: (
                    <ErrorOverlay message={<LocalAwsLambdaTimeoutMessage />} closeable={false} />
                ),
                closeable: false
            });
            return;
        }

        if (code === "Tenancy/TenantDisabled") {
            createErrorOverlay({
                element: <TenantIsDisabled />,
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

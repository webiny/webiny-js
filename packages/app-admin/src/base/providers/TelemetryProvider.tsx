import React, { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";
import { createProvider } from "@webiny/app";

let eventSent = false;

interface TelemetryProviderProps {
    children: React.ReactNode;
}

export const createTelemetryProvider = () => {
    return createProvider(Component => {
        return function TelemetryProvider({ children }: TelemetryProviderProps) {
            useEffect(() => {
                if (eventSent) {
                    return;
                }

                eventSent = true;

                sendEvent("admin-app-start");
            }, []);

            return <Component>{children}</Component>;
        };
    });
};

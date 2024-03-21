import React, { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";

let eventSent = false;

interface TelemetryProviderProps {
    children: React.ReactNode;
}

export const createTelemetryProvider = () => (Component: React.ComponentType) => {
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
};

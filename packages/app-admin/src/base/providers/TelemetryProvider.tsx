import React, { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";
import { ComponentWithChildren } from "~/types";

let eventSent = false;

interface TelemetryProviderProps {
    children: React.ReactNode;
}

export const createTelemetryProvider = () => (Component: ComponentWithChildren) => {
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

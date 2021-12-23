import React, { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";

let eventSent = false;

export const createTelemetryProvider = () => Component => {
    return function TelemetryProvider({ children }) {
        useEffect(() => {
            if (eventSent) {
                return;
            }

            eventSent = true;
            sendEvent("app-start");
        }, []);

        return <Component>{children}</Component>;
    };
};

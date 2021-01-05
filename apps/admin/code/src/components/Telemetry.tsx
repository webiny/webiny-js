import { useEffect } from "react";
import { sendEvent } from "@webiny/tracking/react";

export const Telemetry = () => {
    useEffect(() => {
        sendEvent("app-start");
    }, []);

    return null;
};

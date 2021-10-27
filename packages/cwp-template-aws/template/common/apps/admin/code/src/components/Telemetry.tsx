import { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";

export const Telemetry = () => {
    useEffect(() => {
        sendEvent("app-start");
    }, []);

    return null;
};

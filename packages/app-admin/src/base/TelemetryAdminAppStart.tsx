import { useFeature } from "@webiny/app";
import { useEffect } from "react";
import { TelemetryFeature } from "~/features/telemetry/index.js";

let eventSent = false;

export const TelemetryAdminAppStart = () => {
    const { service } = useFeature(TelemetryFeature);

    useEffect(() => {
        if (eventSent) {
            return;
        }

        eventSent = true;

        service.sendEvent("admin-app-start");
    }, []);

    return null;
};

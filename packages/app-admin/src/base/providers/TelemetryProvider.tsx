import React, { useEffect } from "react";
import { sendEvent } from "@webiny/telemetry/react";
import { useWcp } from "@webiny/app-wcp";

let eventSent = false;

interface TelemetryProviderProps {
    children: React.ReactNode;
}

export const createTelemetryProvider = () => (Component: React.ComponentType) => {
    return function TelemetryProvider({ children }: TelemetryProviderProps) {
        const { getProject } = useWcp();

        useEffect(() => {
            if (eventSent) {
                return;
            }

            eventSent = true;

            const properties: Record<string, string> = {};

            const project = getProject();
            if (project) {
                properties["wcpOrgId"] = project.orgId;
                properties["wcpProjectId"] = project.projectId;
            }

            sendEvent("app-start", properties);
        }, []);

        return <Component>{children}</Component>;
    };
};

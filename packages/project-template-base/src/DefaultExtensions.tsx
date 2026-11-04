import React from "react";
import { Languages } from "@webiny/languages";
import { FrontendSettings } from "@webiny/frontend-settings";
import { TenantManager } from "@webiny/tenant-manager";
import { AiPowerups } from "@webiny/ai-powerups";
import { BugReporter } from "@webiny/bug-reporter";
import { Collaboration } from "@webiny/collaboration";
import { Notifications } from "@webiny/notifications";
import { NotificationsIntegrations } from "@webiny/notifications-integrations";

/**
 * Default feature extensions every Webiny project gets, shared across hosting types (aws + server). The
 * hosting-specific composition (`<ProjectAws />` / `<ProjectStandalone />`), any hosting-specific extensions
 * (e.g. `<Infra.ProductionEnvironments />`), and the user's `webiny.config.tsx` are added by each
 * hosting type's `webiny.config.base.tsx`.
 */
export const DefaultExtensions = () => {
    return (
        <>
            <Languages />
            <FrontendSettings />
            <TenantManager />
            <AiPowerups />
            <BugReporter />
            <Collaboration />
            <Notifications />
            <NotificationsIntegrations />
        </>
    );
};

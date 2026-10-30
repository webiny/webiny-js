/**
 * Component is used to display something that you want to be hidden to everyone except Webiny team.
 * For example a button that should be present only while a feature is being developed and debugged.
 */
import React from "react";

export interface IDeveloperModeProps {
    children: React.ReactNode;
}

export const DeveloperMode = ({ children }: IDeveloperModeProps) => {
    if (process.env.WEBINY_ADMIN_DEV_MODE !== "true") {
        return null;
    }
    return <>{children}</>;
};

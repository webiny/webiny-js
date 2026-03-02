/**
 * Component is used to display something that you want to be hidden to everyone except Webiny team.
 * Example usage is in Workflow State Bar, where we need some button to be present only while developing the feature - and debugging.
 * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarApproved.tsx
 * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarRejected.tsx
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

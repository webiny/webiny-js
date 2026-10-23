import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface NoWorkflowStateProps {
    title: string;
    description: string;
    onCreate(): void;
}

// The open model has no workflow: the title and description come from the presenter (design README 3).
export const NoWorkflowState = ({ title, description, onCreate }: NoWorkflowStateProps) => {
    return (
        <EmptyState
            illustration={false}
            title={title}
            description={description}
            actions={<Button variant="primary" text="Create workflow" onClick={onCreate} />}
        />
    );
};

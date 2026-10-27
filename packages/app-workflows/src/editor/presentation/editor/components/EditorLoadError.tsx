import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface EditorLoadErrorProps {
    description: string;
    onRetry(): void;
}

// The load-error state: an empty state with the error and Try again (design README 4).
export const EditorLoadError = ({ description, onRetry }: EditorLoadErrorProps) => {
    return (
        <EmptyState
            illustration={false}
            title="Could not load workflows"
            description={description}
            actions={<Button variant="tertiary" text="Try again" onClick={onRetry} />}
        />
    );
};

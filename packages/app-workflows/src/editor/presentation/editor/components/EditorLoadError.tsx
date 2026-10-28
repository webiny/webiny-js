import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";

export interface EditorLoadErrorProps {
    description: string;
    onRetry(): void;
}

// The load-error state: an empty state with the error and Try again (design README 4).
export const EditorLoadError = ({ description, onRetry }: EditorLoadErrorProps) => {
    return (
        <EmptyState
            type="layout"
            title="Could not load workflows"
            description={description}
            actions={
                <Button
                    variant="tertiary"
                    text="Try again"
                    icon={<RefreshIcon />}
                    onClick={onRetry}
                />
            }
        />
    );
};

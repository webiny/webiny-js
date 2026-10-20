import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface ReviewListEmptyProps {
    title: string;
    description: string;
    actionLabel: string | null;
    onAction: () => void;
}

// Empty and failed states share one layout: title, optional description, optional action.
export const ReviewListEmpty = ({
    title,
    description,
    actionLabel,
    onAction
}: ReviewListEmptyProps) => {
    let actions: React.ReactNode = null;
    if (actionLabel) {
        actions = <Button variant="tertiary" text={actionLabel} onClick={onAction} />;
    }

    let descriptionText: string | undefined;
    if (description) {
        descriptionText = description;
    }

    return (
        <EmptyState
            illustration={false}
            title={title}
            description={descriptionText}
            actions={actions}
        />
    );
};

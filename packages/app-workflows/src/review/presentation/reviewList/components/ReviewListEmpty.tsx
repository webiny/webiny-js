import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import type { ButtonProps } from "@webiny/admin-ui";

export interface ReviewListEmptyProps {
    title: string;
    description: string;
    actionLabel: string | null;
    actionIcon?: React.ReactElement;
    // The action button's look; "tertiary" unless given.
    actionVariant?: ButtonProps["variant"];
    onAction: () => void;
}

// Empty and failed states share one layout: title, optional description, optional action.
export const ReviewListEmpty = ({
    title,
    description,
    actionLabel,
    actionIcon,
    actionVariant = "tertiary",
    onAction
}: ReviewListEmptyProps) => {
    let actions: React.ReactNode = null;
    if (actionLabel) {
        actions = (
            <Button
                variant={actionVariant}
                text={actionLabel}
                icon={actionIcon}
                onClick={onAction}
            />
        );
    }

    let descriptionText: string | undefined;
    if (description) {
        descriptionText = description;
    }

    return (
        <EmptyState type="table" title={title} description={descriptionText} actions={actions} />
    );
};

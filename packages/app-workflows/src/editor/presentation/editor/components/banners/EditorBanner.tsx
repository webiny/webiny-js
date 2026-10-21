import React from "react";
import { Alert } from "@webiny/admin-ui";

export interface EditorBannerProps {
    title: string | null;
    message: string;
    // The action button's text, or null for a banner without an action.
    actionLabel: string | null;
    dismissible: boolean;
    testId: string;
    onAction?(): void;
    onDismiss?(): void;
}

/*
 * The shell of every editor banner: a destructive alert under the header with an optional title,
 * the message, an optional action button and an optional dismiss button.
 */
export const EditorBanner = (props: EditorBannerProps) => {
    const { title, message, actionLabel, dismissible, testId, onAction, onDismiss } = props;

    let titleLine: React.ReactNode = null;
    if (title !== null) {
        titleLine = <div className="font-semibold">{title}</div>;
    }

    let actions: React.ReactElement | undefined = undefined;
    if (actionLabel !== null) {
        actions = <Alert.Action text={actionLabel} onClick={onAction} />;
    }

    return (
        <div className="px-lg pt-md">
            <Alert
                type="danger"
                variant="subtle"
                data-testid={testId}
                showCloseButton={dismissible}
                onClose={onDismiss}
                actions={actions}
            >
                {titleLine}
                <div>{message}</div>
            </Alert>
        </div>
    );
};

import React, { useCallback } from "react";
import { Alert, Button, Text } from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { IRecordLockingIdentity } from "~/types.js";

interface ForceUnlockButtonProps {
    canForceUnlock: boolean;
    lockedBy: IRecordLockingIdentity | null;
    entryTitle?: string;
    onForceUnlock: () => Promise<boolean>;
    onNavigateBack: () => void;
}

export const ForceUnlockButton = ({
    canForceUnlock,
    lockedBy,
    entryTitle,
    onForceUnlock,
    onNavigateBack
}: ForceUnlockButtonProps) => {
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        title: "Force unlock the entry",
        message: (
            <div>
                <Alert type="warning" title="Warning" className={"mb-md"}>
                    <strong>{lockedBy?.displayName || "Unknown user"}</strong> is currently editing
                    this record.
                    <br />
                    If you force unlock it, they could potentially lose their changes.
                </Alert>
                <Text>
                    You are about to forcefully unlock the <strong>{entryTitle || "entry"}</strong>.
                    Are you sure you want to continue?
                </Text>
            </div>
        )
    });

    const onClick = useCallback(() => {
        showConfirmation(async () => {
            const success = await onForceUnlock();
            if (!success) {
                showSnackbar("Failed to force unlock the entry.");
                return;
            }
            onNavigateBack();
        });
    }, [onForceUnlock, onNavigateBack]);

    if (!canForceUnlock) {
        return null;
    }

    return (
        <div className="mt-md">
            <Text as={"div"} className={"mb-md"}>
                Because you have full access to the system, you can force unlock the record.
            </Text>
            <Button onClick={onClick} text={"Unlock and go back"} />
        </div>
    );
};

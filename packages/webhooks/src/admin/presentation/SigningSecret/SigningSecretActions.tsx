import React, { useCallback } from "react";
import { Button } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin/hooks/index.js";

interface SigningSecretActionsProps {
    getValue: () => string;
    onGenerate: () => void;
}

/**
 * Rendered under a "Signing Secret" field: generates a new random secret, or copies the current
 * one so it can be configured on the receiver.
 */
export const SigningSecretActions = ({ getValue, onGenerate }: SigningSecretActionsProps) => {
    const { showSnackbar } = useSnackbar();

    const handleCopy = useCallback(async () => {
        const secret = getValue();
        if (!secret) {
            showSnackbar("There is no signing secret to copy.");
            return;
        }
        try {
            await navigator.clipboard.writeText(secret);
            showSnackbar("Signing secret copied to clipboard.");
        } catch {
            showSnackbar("Could not copy the signing secret. Copy it from the field instead.");
        }
    }, [getValue, showSnackbar]);

    return (
        <div className="flex gap-sm">
            <Button variant="secondary" size="sm" text="Generate" onClick={onGenerate} />
            <Button variant="secondary" size="sm" text="Copy" onClick={() => void handleCopy()} />
        </div>
    );
};

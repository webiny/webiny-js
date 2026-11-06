import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { WebhookFormPresenterFeature } from "../feature.js";

/**
 * Rendered under the "Signing Secret" field: generates a new random secret, or copies the current
 * one so it can be configured on the receiver.
 */
export const SigningSecretActions = observer(function SigningSecretActions() {
    const { presenter } = useFeature(WebhookFormPresenterFeature);
    const { showSnackbar } = useSnackbar();

    const handleCopy = useCallback(async () => {
        const secret = presenter.getSigningSecret();
        if (!secret) {
            showSnackbar("This webhook has no signing secret of its own.");
            return;
        }
        await navigator.clipboard.writeText(secret);
        showSnackbar("Signing secret copied to clipboard.");
    }, [presenter, showSnackbar]);

    if (!presenter.vm.permissions.canEdit) {
        return null;
    }

    return (
        <div className="flex gap-sm">
            <Button
                variant="secondary"
                size="sm"
                text="Generate"
                onClick={() => presenter.generateSigningSecret()}
            />
            <Button variant="secondary" size="sm" text="Copy" onClick={() => void handleCopy()} />
        </div>
    );
});

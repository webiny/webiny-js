import React, { useState, useCallback } from "react";
import { IconButton, Text } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as VisibilityOffIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";

interface SigningSecretProps {
    secret: string;
}

export const SigningSecret = ({ secret }: SigningSecretProps) => {
    const [revealed, setRevealed] = useState(false);
    const { showSnackbar } = useSnackbar();

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(secret);
        showSnackbar("Signing secret copied to clipboard.");
    }, [secret, showSnackbar]);

    return (
        <div className="flex flex-col gap-xs">
            <Text size="sm" className="text-neutral-strong">
                Signing Secret
            </Text>
            <div className="flex items-center gap-sm rounded-sm border-sm border-neutral-muted px-sm py-xs">
                <Text size="sm" className="flex-1 font-mono select-all">
                    {revealed ? secret : "•".repeat(24)}
                </Text>
                <IconButton
                    icon={revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevealed(prev => !prev)}
                    label={revealed ? "Hide secret" : "Reveal secret"}
                />
                <IconButton
                    icon={<CopyIcon />}
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopy()}
                    label="Copy secret"
                />
            </div>
        </div>
    );
};

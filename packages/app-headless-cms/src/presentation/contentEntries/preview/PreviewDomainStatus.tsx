import React from "react";
import { Alert, OverlayLoader } from "@webiny/admin-ui";

interface PreviewDomainStatusProps {
    error: string | null;
    onRetry: () => void;
}

/**
 * Shown in place of the preview while the Frontend Domain setting loads, or when it fails to load.
 */
export const PreviewDomainStatus = ({ error, onRetry }: PreviewDomainStatusProps) => {
    return (
        <div className="relative border border-neutral-dimmed rounded-t-lg flex flex-col flex-1 h-full overflow-hidden fill-grid">
            {error ? (
                <div className="p-md">
                    <Alert
                        type={"danger"}
                        variant={"subtle"}
                        actions={<Alert.Action text={"Retry"} onClick={onRetry} />}
                    >
                        Could not load the Frontend Domain setting, so the live preview cannot
                        start. {error}
                    </Alert>
                </div>
            ) : (
                <OverlayLoader text="Loading preview settings..." />
            )}
        </div>
    );
};

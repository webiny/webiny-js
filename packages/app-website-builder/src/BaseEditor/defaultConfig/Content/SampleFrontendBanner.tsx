import React, { useCallback } from "react";
import { Alert } from "@webiny/admin-ui";
import { FRONTEND_SETUP_DOCS_URL, SAMPLE_FRONTEND_DOMAIN } from "./sampleFrontend.js";
import { usePreviewDomain } from "./usePreviewDomain.js";

/**
 * Shown while the preview points to Webiny's hosted sample frontend, so it's always clear that the
 * page isn't rendering in the user's own frontend, and how to change that.
 */
export const SampleFrontendBanner = () => {
    const { previewDomain, unsetPreviewDomain } = usePreviewDomain();

    const openInstructions = useCallback(() => {
        // Opened in a new tab so the user doesn't lose the page they're editing.
        window.open(FRONTEND_SETUP_DOCS_URL, "_blank", "noopener,noreferrer");
    }, []);

    if (previewDomain !== SAMPLE_FRONTEND_DOMAIN) {
        return null;
    }

    return (
        <div data-affects-preview={"height"}>
            <Alert
                type={"info"}
                variant={"subtle"}
                className={"rounded-none border-solid border-b-sm border-neutral-dimmed"}
                actions={
                    <>
                        <Alert.Action text={"Learn more"} onClick={openInstructions} />
                        <Alert.Action text={"Disconnect"} onClick={unsetPreviewDomain} />
                    </>
                }
            >
                You&apos;re on Webiny&apos;s sample frontend — pages render only inside the editor.
            </Alert>
        </div>
    );
};

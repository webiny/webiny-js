import React from "react";
import { Alert } from "@webiny/admin-ui";
import { SAMPLE_FRONTEND_DOMAIN } from "./sampleFrontend.js";
import { usePreviewDomain } from "./usePreviewDomain.js";

/**
 * Shown while the preview points to Webiny's hosted sample frontend, so it's always clear that the
 * page isn't rendering in the user's own frontend, and how to go back.
 */
export const SampleFrontendBanner = () => {
    const { previewDomain, unsetPreviewDomain } = usePreviewDomain();

    if (previewDomain !== SAMPLE_FRONTEND_DOMAIN) {
        return null;
    }

    return (
        <div data-affects-preview={"height"}>
            <Alert
                type={"info"}
                variant={"subtle"}
                className={"rounded-none border-solid border-b-sm border-neutral-dimmed"}
                actions={<Alert.Action text={"Disconnect"} onClick={unsetPreviewDomain} />}
            >
                You&apos;re previewing in Webiny&apos;s sample frontend. Locally uploaded images and
                content-bound data won&apos;t render here.
            </Alert>
        </div>
    );
};

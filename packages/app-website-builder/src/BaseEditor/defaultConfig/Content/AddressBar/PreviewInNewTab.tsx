import React from "react";
import { CopyButton, Text, Tooltip, useToast } from "@webiny/admin-ui";
import { usePreviewLink } from "./usePreviewLink.js";

export const PreviewInNewTab = () => {
    const link = usePreviewLink();
    const { showToast } = useToast();

    const confirmClipboard = () => {
        showToast({
            title: "Preview link copied to clipboard!"
        });
    };

    return (
        <Tooltip
            content={<Text size="md">Copy preview link</Text>}
            side="bottom"
            trigger={
                <CopyButton size="md" value={link} onCopy={confirmClipboard} variant={"ghost"} />
            }
        />
    );
};

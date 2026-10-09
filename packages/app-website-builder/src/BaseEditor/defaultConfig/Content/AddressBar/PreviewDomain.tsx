import React, { useEffect } from "react";
import { PreviewDomainMenu } from "@webiny/frontend-settings/exports/admin.js";
import { usePreviewDomain } from "../usePreviewDomain.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const PreviewDomain = () => {
    const editor = useDocumentEditor();
    const { previewDomain } = usePreviewDomain();

    useEffect(() => {
        if (!previewDomain) {
            return;
        }

        editor.executeCommand(Commands.RefreshPreview);
    }, [previewDomain]);

    return <PreviewDomainMenu className={"absolute left-0 top-0"} />;
};

import React, { useCallback } from "react";
import { IconButton, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const RefreshPreview = () => {
    const editor = useDocumentEditor();

    const refresh = useCallback(() => {
        editor.executeCommand(Commands.RefreshPreview);
    }, []);

    return (
        <Tooltip
            content={<Text size="md">Refresh preview</Text>}
            side="bottom"
            trigger={
                <IconButton icon={<RefreshIcon />} size="md" onClick={refresh} variant={"ghost"} />
            }
        />
    );
};

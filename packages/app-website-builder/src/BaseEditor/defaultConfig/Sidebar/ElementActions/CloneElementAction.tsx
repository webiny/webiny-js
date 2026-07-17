import React, { useCallback } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const CloneElementAction = () => {
    const [element] = useActiveElement();
    const editor = useDocumentEditor();

    const onClick = useCallback(() => {
        if (element) {
            editor.executeCommand(Commands.CloneElement, { id: element.id });
        }
    }, [element?.id]);

    return <DropdownMenu.Item icon={<ContentCopyIcon />} text={"Clone"} onClick={onClick} />;
};

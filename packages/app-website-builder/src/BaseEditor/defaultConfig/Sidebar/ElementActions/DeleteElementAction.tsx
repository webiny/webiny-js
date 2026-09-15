import React, { useCallback } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const DeleteElementAction = () => {
    const [element] = useActiveElement();
    const editor = useDocumentEditor();

    const onClick = useCallback(() => {
        if (element) {
            editor.executeCommand(Commands.DeleteElement, { id: element.id });
        }
    }, [element?.id]);

    return (
        <DropdownMenu.Item
            className={"text-destructive-primary [&_svg]:fill-destructive"}
            icon={<DeleteIcon />}
            text={"Delete"}
            onClick={onClick}
        />
    );
};

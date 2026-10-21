import React, { useCallback } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { LayoutContentArea, GlobalElementId } from "@webiny/website-builder-sdk";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { $isLayoutElement } from "~/editorSdk/utils/$getEditableElement.js";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const DeleteElementAction = () => {
    const [element] = useActiveElement();
    const editor = useDocumentEditor();
    const isLayoutElement = useSelectFromDocument(
        document => (element ? $isLayoutElement(document, element.id) : false),
        [element?.id]
    );
    const isMainContentArea = useSelectFromDocument(
        document => {
            return element?.component.name === LayoutContentArea.MAIN_COMPONENT
                ? LayoutContentArea.mainWithin(document, element.id)
                : false;
        },
        [element?.id]
    );

    const onClick = useCallback(() => {
        if (element) {
            editor.executeCommand(Commands.DeleteElement, { id: element.id });
        }
    }, [element?.id]);

    // A layout's elements can't be deleted from the page, a global's instance isn't in the tree (its
    // placements are), and a layout always has its main page content area.
    if (element && (isLayoutElement || GlobalElementId.isGlobal(element.id) || isMainContentArea)) {
        return null;
    }

    return (
        <DropdownMenu.Item
            className={"text-destructive-primary [&_svg]:fill-destructive"}
            icon={<DeleteIcon />}
            text={"Delete"}
            onClick={onClick}
        />
    );
};

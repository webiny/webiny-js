import React, { useCallback } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import { LayoutContentArea, GlobalElementId } from "@webiny/website-builder-sdk";
import { $isLayoutElement } from "~/editorSdk/utils/$getEditableElement.js";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const CloneElementAction = () => {
    const [element] = useActiveElement();
    const editor = useDocumentEditor();
    const holdsLayoutContent = useSelectFromDocument(
        document => (element ? LayoutContentArea.anyWithin(document, element.id) : false),
        [element?.id]
    );
    const isLayoutElement = useSelectFromDocument(
        document => (element ? $isLayoutElement(document, element.id) : false),
        [element?.id]
    );

    const onClick = useCallback(() => {
        if (element) {
            editor.executeCommand(Commands.CloneElement, { id: element.id });
        }
    }, [element?.id]);

    // A layout holds exactly one page content, its elements can't be changed from the page, and a
    // global's instance isn't in the tree (its placements are, and can be cloned).
    if (
        holdsLayoutContent ||
        isLayoutElement ||
        (element && GlobalElementId.isGlobal(element.id))
    ) {
        return null;
    }

    return <DropdownMenu.Item icon={<ContentCopyIcon />} text={"Clone"} onClick={onClick} />;
};

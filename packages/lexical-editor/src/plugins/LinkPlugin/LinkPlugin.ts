import { useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import {
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    PASTE_COMMAND
} from "lexical";
import { LinkNode, TOGGLE_LINK_COMMAND, toggleLink } from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks";

type Props = {
    validateUrl?: (url: string) => boolean;
};

export function LinkPlugin({ validateUrl }: Props): null {
    const { editor } = useRichTextEditor();

    useEffect(() => {
        if (!editor.hasNodes([LinkNode])) {
            throw new Error("LinkPlugin: LinkNode not registered in the editor!");
        }

        const commands = [
            editor.registerCommand(
                TOGGLE_LINK_COMMAND,
                payload => {
                    if (payload === null) {
                        toggleLink(payload);
                        return true;
                    } else if (typeof payload === "string") {
                        if (validateUrl === undefined || validateUrl(payload)) {
                            toggleLink(payload);
                            return true;
                        }
                        return false;
                    } else {
                        const { url, ...attrs } = payload;
                        toggleLink(url, attrs);
                        return true;
                    }
                },
                COMMAND_PRIORITY_LOW
            )
        ];

        if (validateUrl !== undefined) {
            commands.push(
                editor.registerCommand(
                    PASTE_COMMAND,
                    event => {
                        const selection = $getSelection();
                        if (
                            !$isRangeSelection(selection) ||
                            selection.isCollapsed() ||
                            !(event instanceof ClipboardEvent) ||
                            event.clipboardData == null
                        ) {
                            return false;
                        }
                        const clipboardText = event.clipboardData.getData("text");
                        if (!validateUrl(clipboardText)) {
                            return false;
                        }
                        // If we select nodes that are elements then avoid applying the link.
                        if (!selection.getNodes().some(node => $isElementNode(node))) {
                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, clipboardText);
                            event.preventDefault();
                            return true;
                        }
                        return false;
                    },
                    COMMAND_PRIORITY_LOW
                )
            );
        }

        return mergeRegister(...commands);
    }, [editor, validateUrl]);

    return null;
}

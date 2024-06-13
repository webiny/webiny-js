import { useEffect } from "react";
import {
    $applyStylesToNode,
    $createFontColorNode,
    ADD_FONT_COLOR_COMMAND,
    FontColorPayload,
    $createParagraphNode
} from "@webiny/lexical-nodes";
import {
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import { useRichTextEditor } from "~/hooks";

export const FontColorPlugin = () => {
    const { editor } = useRichTextEditor();

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { color, themeColorName } = payload;
                    const selection = $getSelection();

                    if ($isRangeSelection(selection)) {
                        const fontColorNode = $createFontColorNode(
                            selection.getTextContent(),
                            color,
                            themeColorName
                        );
                        $applyStylesToNode(fontColorNode, selection);
                        $insertNodes([fontColorNode]);
                        if ($isRootOrShadowRoot(fontColorNode.getParentOrThrow())) {
                            $wrapNodeInElement(fontColorNode, $createParagraphNode).selectEnd();
                        }
                    }
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

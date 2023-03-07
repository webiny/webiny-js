import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { usePageElements } from "@webiny/app-page-builder-elements";
import {
    $createFontColorNode,
    ADD_FONT_COLOR_COMMAND,
    FontColorPayload
} from "~/nodes/FontColorNode";
import {
    $createParagraphNode,
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";

export const FontColorPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();
    const pageElements = usePageElements();

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { themeColor } = payload;
                    const selection = editor.getEditorState().read($getSelection);
                    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                        const colors = pageElements.theme?.styles?.colors;
                        const applyColor = colors[themeColor] ?? themeColor;
                        const fontColorNode = $createFontColorNode(
                            selection.getTextContent(),
                            applyColor,
                            themeColor
                        );
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

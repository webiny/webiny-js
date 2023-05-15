import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createFontColorNode,
    ADD_FONT_COLOR_COMMAND,
    FontColorPayload
} from "~/nodes/FontColorNode";
import {
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import { $createParagraphNode } from "~/nodes/ParagraphNode";
import {$patchStyleText} from "@lexical/selection";
import {useRichTextEditor} from "~/hooks/useRichTextEditor";

export const FontColorPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();
    const { theme } = useRichTextEditor();

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { color, themeColorName } = payload;
                    const selection = $getSelection();
                    debugger;
                    if ($isRangeSelection(selection)) {
                        const fontColorNode = $createFontColorNode(
                            selection.getTextContent(),
                            color,
                            themeColorName
                        );
                        if(themeColorName) {
                            // $applyStylesToNode(fontColorNode, selection);
                            $insertNodes([fontColorNode]);
                            if ($isRootOrShadowRoot(fontColorNode.getParentOrThrow())) {
                                $wrapNodeInElement(fontColorNode, $createParagraphNode).selectEnd();
                            }
                            $patchStyleText(fontColorNode.select(), {
                                color: "green"
                            });
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

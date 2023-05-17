import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createFontColorNode, $isFontColorNode,
    ADD_FONT_COLOR_COMMAND, FontColorNode,
    FontColorPayload
} from "~/nodes/FontColorNode";
import {
    $createNodeSelection,
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    $isTextNode as $isBaseTextNode, $setSelection,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import { $createParagraphNode } from "~/nodes/ParagraphNode";
import {$getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType} from "@lexical/selection";
import {useRichTextEditor} from "~/hooks/useRichTextEditor";
import {getLexicalTextSelectionState, getSelectionTextFormat} from "~/utils/getLexicalTextSelectionState";
import {$patchThemeStyleText} from "~/utils/nodes/patchThemeText";

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



                    if ($isRangeSelection(selection)) {
                        const selectedBlock = getLexicalTextSelectionState(editor, selection);
                        debugger;
                        const fontColorNodes = $patchThemeStyleText(selection, color, themeColorName);
                        if(fontColorNodes) {
                           $insertNodes([...fontColorNodes]);

                        }

                       // if(themeColorName) {
                            // $applyStylesToNode(fontColorNode, selection);
                           // $insertNodes([...fontColorNodes]);

                           /* if ($isRootOrShadowRoot(fontColorNode.getParentOrThrow())) {
                                $wrapNodeInElement(fontColorNode, $createParagraphNode).selectEnd();
                            }*/

                           /* $patchStyleText(fontColorNode.select(), {
                                color: "green"
                            });*/
                        //}
                    }
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

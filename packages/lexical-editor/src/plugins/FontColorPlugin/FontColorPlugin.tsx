import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ADD_FONT_COLOR_COMMAND, FontColorNode, FontColorPayload } from "~/nodes/FontColorNode";
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

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { color, themeColorName } = payload;
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const fontColorNode = new FontColorNode(
                            selection.getTextContent(),
                            color,
                            themeColorName
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

    /*    useEffect(() => {
        return editor.registerMutationListener(FontColorTextNode, mutatedNodes => {
            // mutatedNodes is a Map where each key is the NodeKey, and the value is the state of mutation.
            for (const [nodeKey, mutation] of mutatedNodes) {
                console.log(nodeKey, mutation);
                console.log(mutatedNodes.get(nodeKey));
            }
        });
    }, [editor]);

    useEffect(() => {
        return editor.registerNodeTransform(FontColorTextNode, paragraph => {
            // Triggers
            editor.update(() => {
                const paragraph = $getRoot().getFirstChild();
                console.log("transform");
            });
        });
    }, [editor]);*/

    return null;
};

import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { usePageElements } from "@webiny/app-page-builder-elements";
import {
    $createFontColorNode,
    ADD_FONT_COLOR_COMMAND,
    FontColorPayload,
    FontColorTextNode
} from "~/nodes/FontColorNode";
import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";

export const FontColorPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();
    const { theme } = usePageElements();

    useEffect(() => {
        return editor.registerCommand<FontColorPayload>(
            ADD_FONT_COLOR_COMMAND,
            payload => {
                editor.update(() => {
                    const { color } = payload;
                    const selection = editor.getEditorState().read($getSelection);
                    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                        const fontColorNode = $createFontColorNode(
                            selection.getTextContent(),
                            color,
                            theme.styles
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

    useEffect(() => {
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
                if (paragraph) {
                    paragraph.append($createTextNode("foo"));
                }
            });
        });
    }, [editor]);

    return null;
};

import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createParagraphNode,
    $getSelection,
    $insertNodes,
    $isRangeSelection,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import {
    $applyStylesToNode,
    $createTypographyNode,
    ADD_TYPOGRAPHY_COMMAND,
    TypographyPayload
} from "~/nodes/TypographyNode";

export const TypographyPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<TypographyPayload>(
            ADD_TYPOGRAPHY_COMMAND,
            payload => {
                editor.update(() => {
                    const { value } = payload;
                    const selection = $getSelection();

                    if ($isRangeSelection(selection)) {
                        const typographyNode = $createTypographyNode(
                            selection.getTextContent(),
                            value.styleObject,
                            value.themeTypographyName
                        );
                        $applyStylesToNode(typographyNode, selection);
                        $insertNodes([typographyNode]);
                        if ($isRootOrShadowRoot(typographyNode.getParentOrThrow())) {
                            $wrapNodeInElement(typographyNode, $createParagraphNode).selectEnd();
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

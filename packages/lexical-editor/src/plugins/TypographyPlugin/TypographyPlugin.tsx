import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import {
    $createTypographyNode,
    ADD_TYPOGRAPHY_ELEMENT_COMMAND,
    TypographyPayload
} from "~/nodes/TypographyElementNode";
import { $wrapNodes } from "@lexical/selection";

export const TypographyPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<TypographyPayload>(
            ADD_TYPOGRAPHY_ELEMENT_COMMAND,
            payload => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createTypographyNode(payload.value));
                }
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import {
    ADD_TYPOGRAPHY_ELEMENT_COMMAND,
    TypographyPayload
} from "~/nodes/TypographyElementNode";
import { $wrapNodes } from "@lexical/selection";
import { $createBaseParagraphNode } from "~/nodes/BaseParagraphNode";

export const TypographyPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<TypographyPayload>(
            ADD_TYPOGRAPHY_ELEMENT_COMMAND,
            payload => {
                const selection = $getSelection();
                if ($isRangeSelection(selection) && payload.value.id && payload.value.tag === "p") {
                    debugger;
                    $wrapNodes(selection, () => $createBaseParagraphNode(payload.value.id));
                }
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

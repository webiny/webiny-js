import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import { ADD_TYPOGRAPHY_COMMAND, TypographyPayload } from "~/nodes/TypographyNode";
import { formatToParagraph } from "~/utils/nodes/formatToParagraph";
import { formatToHeading } from "~/utils/nodes/formatToHeading";
import { HeadingTagType } from "@lexical/rich-text";

export const TypographyPlugin: React.FC = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<TypographyPayload>(
            ADD_TYPOGRAPHY_COMMAND,
            payload => {
                const selection = $getSelection();
                // paragraph
                if ($isRangeSelection(selection) && payload.value.id && payload.value.tag === "p") {
                    formatToParagraph(editor, payload.value.id);
                }
                // heading
                if (
                    $isRangeSelection(selection) &&
                    payload.value.id &&
                    payload.value.tag.includes("h")
                ) {
                    formatToHeading(editor, payload.value.tag as HeadingTagType, payload.value.id);
                }
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createParagraphNode } from "~/ParagraphNode";

export const formatToParagraph = (editor: LexicalEditor, typographyStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode(typographyStyleId));
        }
    });
};

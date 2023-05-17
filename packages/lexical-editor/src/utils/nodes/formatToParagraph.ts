import {
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $createParagraphNode } from "~/nodes/ParagraphNode";
import { $setBlocksType } from "@lexical/selection";

export const formatToParagraph = (editor: LexicalEditor, typographyStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode(typographyStyleId));
        }
    });
};

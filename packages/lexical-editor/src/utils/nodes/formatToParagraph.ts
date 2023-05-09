import {
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $createBaseParagraphNode } from "~/nodes/BaseParagraphNode";
import { $setBlocksType } from "@lexical/selection";

export const formatToParagraph = (editor: LexicalEditor, typographyStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $setBlocksType(selection, () => $createBaseParagraphNode(typographyStyleId));
        }
    });
};

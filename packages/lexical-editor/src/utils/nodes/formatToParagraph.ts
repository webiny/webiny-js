import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $wrapNodes } from "@lexical/selection";

export const formatToParagraph = (editor: LexicalEditor) => {
    editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $wrapNodes(selection, () => $createParagraphNode());
        }
    });
};

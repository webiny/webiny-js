import {
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $wrapNodes } from "@lexical/selection";
import { $createWebinyQuoteNode } from "~/nodes/WebinyQuoteNode";

export const formatToQuote = (editor: LexicalEditor, themeStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $wrapNodes(selection, () => $createWebinyQuoteNode(themeStyleId));
        }
    });
};

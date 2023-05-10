import {
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createBaseQuoteNode } from "~/nodes/BaseQuoteNode";

/*
 * Will change the selected root HTML tag to specified quoteblock tag.
 * For example if the selection is paragraph <p> with content inside after formatting the root tag
 * will be quoteblock with same content inside.
 * */
export const formatBaseToQuote = (editor: LexicalEditor, themeStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $setBlocksType(selection, () => $createBaseQuoteNode(themeStyleId));
        }
    });
};

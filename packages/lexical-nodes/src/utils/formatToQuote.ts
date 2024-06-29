import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createQuoteNode } from "~/QuoteNode";

/*
 * Will change the selected root HTML tag to specified blockquote tag.
 * For example if the selection is paragraph <p> with content inside after formatting the root tag
 * will be blockquote with same content inside.
 * */
export const formatToQuote = (editor: LexicalEditor, themeStyleId?: string) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode(themeStyleId));
        }
    });
};

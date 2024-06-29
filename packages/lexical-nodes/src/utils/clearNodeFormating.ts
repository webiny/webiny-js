import { $isRangeSelection, $isTextNode, LexicalEditor, RangeSelection } from "lexical";
import { $selectAll } from "@lexical/selection";
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";

export const clearNodeFormatting = (
    activeEditor: LexicalEditor,
    selection: RangeSelection | null
) => {
    activeEditor.update(() => {
        if ($isRangeSelection(selection)) {
            $selectAll(selection);
            selection.getNodes().forEach(node => {
                if ($isTextNode(node)) {
                    node.setFormat(0);
                    node.setStyle("");
                    $getNearestBlockElementAncestorOrThrow(node).setFormat("");
                }
                if ($isDecoratorBlockNode(node)) {
                    node.setFormat("");
                }
            });
        }
    });
};

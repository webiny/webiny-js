/*
import {$isTextNode, RangeSelection, TextNode} from "lexical";


patchStyle

/!**
 * Applies the provided styles to the TextNodes that are implementing the Webiny theme styles in the provided Selection.
 * Will update partially selected TextNodes by splitting the TextNode and applying
 * the styles to the appropriate one.
 * @param selection - The selected node(s) to update.
 * @param patch - The patch to apply, which can include multiple styles. { CSSProperty: value }
 *!/
export function $patchStyleText(
    selection: RangeSelection,
    patch: Record<string, string | null>,
): void {
    const selectedNodes = selection.getNodes();
    const selectedNodesLength = selectedNodes.length;
    const lastIndex = selectedNodesLength - 1;
    let firstNode = selectedNodes[0];
    let lastNode = selectedNodes[lastIndex];

    if (selection.isCollapsed()) {
        $patchStyle(selection, patch);
        return;
    }

    const anchor = selection.anchor;
    const focus = selection.focus;
    const firstNodeText = firstNode.getTextContent();
    const firstNodeTextLength = firstNodeText.length;
    const focusOffset = focus.offset;
    let anchorOffset = anchor.offset;
    const isBefore = anchor.isBefore(focus);
    let startOffset = isBefore ? anchorOffset : focusOffset;
    let endOffset = isBefore ? focusOffset : anchorOffset;
    const startType = isBefore ? anchor.type : focus.type;
    const endType = isBefore ? focus.type : anchor.type;
    const endKey = isBefore ? focus.key : anchor.key;

    // This is the case where the user only selected the very end of the
    // first node so we don't want to include it in the formatting change.
    if ($isTextNode(firstNode) && startOffset === firstNodeTextLength) {
        const nextSibling = firstNode.getNextSibling();

        if ($isTextNode(nextSibling)) {
            // we basically make the second node the firstNode, changing offsets accordingly
            anchorOffset = 0;
            startOffset = 0;
            firstNode = nextSibling;
        }
    }

    // This is the case where we only selected a single node
    if (selectedNodes.length === 1) {
        if ($isTextNode(firstNode)) {
            startOffset =
                startType === 'element'
                    ? 0
                    : anchorOffset > focusOffset
                        ? focusOffset
                        : anchorOffset;
            endOffset =
                endType === 'element'
                    ? firstNodeTextLength
                    : anchorOffset > focusOffset
                        ? anchorOffset
                        : focusOffset;

            // No actual text is selected, so do nothing.
            if (startOffset === endOffset) {
                return;
            }

            // The entire node is selected, so just format it
            if (startOffset === 0 && endOffset === firstNodeTextLength) {
                $patchStyle(firstNode, patch);
                firstNode.select(startOffset, endOffset);
            } else {
                // The node is partially selected, so split it into two nodes
                // and style the selected one.
                const splitNodes = firstNode.splitText(startOffset, endOffset);
                const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1];
                $patchStyle(replacement, patch);
                replacement.select(0, endOffset - startOffset);
            }
        } // multiple nodes selected.
    } else {
        if (
            $isTextNode(firstNode) &&
            startOffset < firstNode.getTextContentSize()
        ) {
            if (startOffset !== 0) {
                // the entire first node isn't selected, so split it
                firstNode = firstNode.splitText(startOffset)[1];
                startOffset = 0;
            }

            $patchStyle(firstNode as TextNode, patch);
        }

        if ($isTextNode(lastNode)) {
            const lastNodeText = lastNode.getTextContent();
            const lastNodeTextLength = lastNodeText.length;

            // The last node might not actually be the end node
            //
            // If not, assume the last node is fully-selected unless the end offset is
            // zero.
            if (lastNode.__key !== endKey && endOffset !== 0) {
                endOffset = lastNodeTextLength;
            }

            // if the entire last node isn't selected, split it
            if (endOffset !== lastNodeTextLength) {
                [lastNode] = lastNode.splitText(endOffset);
            }

            if (endOffset !== 0) {
                $patchStyle(lastNode as TextNode, patch);
            }
        }

        // style all the text nodes in between
        for (let i = 1; i < lastIndex; i++) {
            const selectedNode = selectedNodes[i];
            const selectedNodeKey = selectedNode.getKey();

            if (
                $isTextNode(selectedNode) &&
                selectedNodeKey !== firstNode.getKey() &&
                selectedNodeKey !== lastNode.getKey() &&
                !selectedNode.isToken()
            ) {
                $patchStyle(selectedNode, patch);
            }
        }
    }
}
*/

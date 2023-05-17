import {$isTextNode as $isBaseTextNode, RangeSelection, TextNode} from "lexical";
import {$createFontColorNode, $isFontColorNode, FontColorNode} from "~/nodes/FontColorNode";

/**
 * Applies the provided styles to the TextNodes that are implementing the Webiny theme styles in the provided Selection.
 * Will update partially selected TextNodes by splitting the TextNode and applying
 * the styles to the appropriate one.
 * @param selection - The selected node(s) to update.
 * @param patch - The patch to apply, which can include multiple styles. { CSSProperty: value }
 */
export function $patchThemeStyleText(
    selection: RangeSelection,
    color: string,
    themeColorName?: string,
): FontColorNode[] | undefined {
    const fontColorNodes: FontColorNode[] = [];
    const selectedNodes = selection.getNodes();
    const selectedNodesLength = selectedNodes.length;
    const lastIndex = selectedNodesLength - 1;
    let firstNode = selectedNodes[0];
    let lastNode = selectedNodes[lastIndex];

    if (selection.isCollapsed()) {
            const fontColorNode = $createFontColorNode(
                selection.getTextContent(),
                color,
                themeColorName
            );
            fontColorNodes.push(fontColorNode);
            return fontColorNodes;
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
    if ($isBaseTextNode(firstNode) && startOffset === firstNodeTextLength) {
        const nextSibling = firstNode.getNextSibling();

        if ($isBaseTextNode(nextSibling)) {
            // we basically make the second node the firstNode, changing offsets accordingly
            anchorOffset = 0;
            startOffset = 0;
            firstNode = nextSibling;
        }
    }

    // This is the case where we only selected a single node
    if (selectedNodes.length === 1) {
        if ($isBaseTextNode(firstNode)) {
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
                return undefined;
            }

            // The entire node is selected, so just format it
            if (startOffset === 0 && endOffset === firstNodeTextLength) {
                // $patchStyle(firstNode, patch);
                firstNode.select(startOffset, endOffset);
                const fontColorNode = $createFontColorNode(
                    firstNode.getTextContent(),
                    color,
                    themeColorName
                );
                fontColorNode.setStyle(firstNode.getStyle());
                selection.insertNodes([fontColorNode]);
                debugger;
                return fontColorNodes;
            } else {
                // The node is partially selected, so split it into two nodes
                // and style the selected one.
                const splitNodes = firstNode.splitText(startOffset, endOffset) as FontColorNode[];
                const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1];
             /*   if(startOffset !== 0) {
                    const [firstSplitNode] = splitNodes;
                    if(firstSplitNode.getParentOrThrow()) {
                        fontColorNodes.push(firstSplitNode as FontColorNode);
                    }
                }*/

                replacement.select(0, endOffset - startOffset);

               // replacement.setThemeStyle(color, themeColorName);
                const fontColorNode = $createFontColorNode(
                    replacement.getTextContent(),
                    color,
                    themeColorName
                )
                fontColorNode.__next = replacement.__text;
                fontColorNode.__parent = replacement.__parent;
                fontColorNode.__prev = replacement.__prev;
                fontColorNode.setStyle(replacement.getStyle());
                fontColorNode.setFormat(replacement.getFormat());
                fontColorNodes.push(fontColorNode);

               /* if(splitNodes.length > 1) {
                    debugger;
                    for (let i = 2; i < splitNodes.length; i++) {
                        const sNode = splitNodes[i];
                        if(!$isFontColorNode(sNode) && sNode.getParentOrThrow()){
                            const fNode = $createFontColorNode(
                                sNode.getTextContent(),
                                color,
                                themeColorName,
                                sNode.getKey()
                            );
                            fNode.__next = sNode.__text;
                            fNode.__parent = sNode.__parent;
                            fNode.__prev = sNode.__prev;
                            fNode.setFormat(sNode.getFormat());
                            fNode.setStyle(sNode.getStyle());
                            fontColorNodes.push(fNode);
                        }
                    }
                }*/
                debugger;
                return splitNodes;
            }
        } // multiple nodes selected.
    } else {
        if (
            $isBaseTextNode(firstNode) &&
            startOffset < firstNode.getTextContentSize()
        ) {
            if (startOffset !== 0) {
                // the entire first node isn't selected, so split it
                firstNode = firstNode.splitText(startOffset)[1];
                startOffset = 0;
            }

           // $patchStyle(firstNode as TextNode, patch);
            const fontColorNode = $createFontColorNode(
                firstNode.getTextContent(),
                color,
                themeColorName
            );
            fontColorNode.setStyle(firstNode.getStyle());
            fontColorNodes.push(fontColorNode);
        }

        if ($isBaseTextNode(lastNode)) {
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
                // $patchStyle(lastNode as TextNode, patch);
                const lastFontColorNode = $createFontColorNode(
                    lastNode.getTextContent(),
                    color,
                    themeColorName
                );
                lastFontColorNode.setStyle(lastNode.getStyle());
                fontColorNodes.push(lastFontColorNode);
            }
        }

        // style all the text nodes in between
        for (let i = 1; i < lastIndex; i++) {
            const selectedNode = selectedNodes[i];
            const selectedNodeKey = selectedNode.getKey();

            if (
                $isBaseTextNode(selectedNode) &&
                selectedNodeKey !== firstNode.getKey() &&
                selectedNodeKey !== lastNode.getKey() &&
                !selectedNode.isToken()
            ) {
                // $patchStyle(selectedNode, patch);
                const fontColorNode = $createFontColorNode(
                    selectedNode.getTextContent(),
                    color,
                    themeColorName
                );
                fontColorNode.setStyle(selectedNode.getStyle());
                fontColorNodes.push(fontColorNode);
            }
        }
    }
    return fontColorNodes;
}

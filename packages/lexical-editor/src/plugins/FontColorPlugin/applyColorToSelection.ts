import { RangeSelection, TextNode } from "lexical";
import { ThemeColorValue } from "@webiny/lexical-nodes";
import { applyColorToNode } from "~/plugins/FontColorPlugin/applyColorToNode";

export function applyColorToSelection(selection: RangeSelection, color: ThemeColorValue) {
    // Basic variables
    const textNodes = selection.getNodes().filter(node => node instanceof TextNode) as TextNode[];

    const selectedTextNodesLength = textNodes.length;
    const startEndPoints = selection.getStartEndPoints();

    if (startEndPoints === null) {
        return;
    }

    const [anchor, focus] = startEndPoints;

    const lastIndex = selectedTextNodesLength - 1;
    const firstNode = textNodes[0];
    const lastNode = textNodes[lastIndex];
    const firstNodeText = firstNode.getTextContent();
    const firstNodeTextLength = firstNodeText.length;
    const focusOffset = focus.offset;
    const anchorOffset = anchor.offset;
    const isBefore = anchor.isBefore(focus);
    const startOffset = isBefore ? anchorOffset : focusOffset;
    const endOffset = isBefore ? focusOffset : anchorOffset;

    // No actual text is selected, so do nothing.
    if (startOffset === endOffset) {
        return;
    }

    // Only one node is selected.
    if (selectedTextNodesLength === 1) {
        // The entire node is selected.
        if (startOffset === 0 && endOffset === firstNodeTextLength) {
            const fontColorNode = applyColorToNode(firstNode, color);
            fontColorNode.select(startOffset, endOffset);
            return;
        }

        // The node is partially selected, so split it into two nodes and style the selected part.
        const splitNodes = firstNode.splitText(startOffset, endOffset);
        const replacement = startOffset === 0 ? splitNodes[0] : splitNodes[1];
        const fontColorNode = applyColorToNode(replacement, color);
        fontColorNode.select(0, endOffset - startOffset);

        return;
    }

    // Several nodes are selected.
    textNodes.forEach(textNode => {
        // First node is partially selected.
        if (textNode === firstNode && startOffset > 0) {
            const [, toColor] = textNode.splitText(startOffset);
            applyColorToNode(toColor, color);

            return;
        }

        // Last node is partially selected.
        if (textNode === lastNode && lastNode.getTextContent().length !== endOffset) {
            const [toColor] = textNode.splitText(endOffset);
            applyColorToNode(toColor, color);
            return;
        }

        // Colorize the whole node.
        applyColorToNode(textNode, color);
    });
}

import { TextNode } from "lexical";
import { $applyStylesToNode, $createFontColorNode, ThemeColorValue } from "@webiny/lexical-nodes";

export function applyColorToNode(textNode: TextNode, color: ThemeColorValue) {
    const fontColorNode = $createFontColorNode(textNode.getTextContent(), color);
    $applyStylesToNode(fontColorNode, textNode);

    return textNode.replace(fontColorNode);
}

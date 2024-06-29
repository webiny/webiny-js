import { $isRootOrShadowRoot, TextNode } from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import {
    $applyStylesToNode,
    $createFontColorNode,
    $createParagraphNode,
    ThemeColorValue
} from "@webiny/lexical-nodes";

export function applyColorToNode(textNode: TextNode, color: ThemeColorValue) {
    const fontColorNode = $createFontColorNode(textNode.getTextContent(), color);
    $applyStylesToNode(fontColorNode, textNode);

    textNode.replace(fontColorNode);

    if ($isRootOrShadowRoot(fontColorNode.getParentOrThrow())) {
        $wrapNodeInElement(fontColorNode, $createParagraphNode).selectEnd();
    }

    return fontColorNode;
}

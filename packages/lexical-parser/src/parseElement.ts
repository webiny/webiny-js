import { isLexicalElement } from "~/utils/isLexicalElement";
import { getLexicalContentText } from "~/utils/getLexicalContentText";
import { isTextNode } from "~/utils/isTextNode";
import { LexicalNodeConfig, ParsedElementNode } from "~/types";

export const parseElement = (
    lexicalNode: Record<string, any>,
    configMap: Map<string, LexicalNodeConfig>
): ParsedElementNode | null => {
    if (!configMap.has(lexicalNode.type)) {
        return null;
    }

    if (!isLexicalElement(lexicalNode)) {
        return null;
    }

    const config = configMap.get(lexicalNode.type);

    const elementNode: ParsedElementNode = {
        html: "",
        tag: config?.elementNode?.tag ?? lexicalNode?.tag,
        type: lexicalNode.type,
        text: ""
    };

    // get text
    if (!!lexicalNode?.children?.length) {
        elementNode.text = getLexicalContentText(lexicalNode);
    }

    const hasChildrenNodes = !!lexicalNode?.children?.length;
    // Parse HTML
    elementNode.html = `<${elementNode.tag}>
             ${
                 hasChildrenNodes
                     ? lexicalNode?.children
                           .map((node: Record<string, any>) => {
                               if (isLexicalElement(node)) {
                                   return parseElement(node, configMap)?.html;
                               } else if (isTextNode(node)) {
                                   return getLexicalContentText(node);
                               }
                               return "";
                           })
                           .join("")
                           .replace(/(\r\n|\n|\r)/gm, "") // Remove any new line char
                           .trim()
                     : elementNode.text
             }
            </${elementNode.tag}>`;

    const htmlTransformerCallback = config ? config?.htmlTransformer : undefined;
    const textTransformerCallback = config ? config?.textTransformer : undefined;

    if (htmlTransformerCallback) {
        elementNode.html = htmlTransformerCallback(elementNode, lexicalNode, config);
    }

    if (textTransformerCallback) {
        elementNode.text = textTransformerCallback(elementNode, lexicalNode, config);
    }

    return elementNode;
};

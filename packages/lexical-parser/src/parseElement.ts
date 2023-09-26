import { isLexicalElement } from "~/utils/isLexicalElement";
import { getLexicalContentText } from "~/utils/getLexicalContentText";
import { isTextNode } from "~/utils/isTextNode";
import { ElementNode, LexicalNodeProcessorConfig } from "~/types";

export const parseElement = (
    lexicalNode: Record<string, any>,
    configMap: Map<string, LexicalNodeProcessorConfig>
): ElementNode | null => {
    if (!configMap.has(lexicalNode.type)) {
        return null;
    }

    if (!isLexicalElement(lexicalNode)) {
        return null;
    }

    const config = configMap.get(lexicalNode.type);
    const htmlProcessorCallback = config ? config?.htmlProcessor : undefined;

    const elementNode: ElementNode = {
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
                           .replace(/(\n)|(\r)|(\r\n)/gi, "") // Remove any new line char
                           .trim()
                     : elementNode.text
             }
            </${elementNode.tag}>`;

    if (htmlProcessorCallback) {
        elementNode.html = htmlProcessorCallback(elementNode, lexicalNode, config);
    }

    return elementNode;
};

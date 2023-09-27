import { parseElement } from "~/parseElement";
import { isLexicalElement } from "~/utils/isLexicalElement";
import { ElementNodeConfig, LexicalNodeConfig, LexicalValue, NodeContentOutput } from "~/types";

export const parse = (
    value: LexicalValue,
    configMap: Map<string, LexicalNodeConfig>
): NodeContentOutput[] => {
    const rootNode = value["root"];
    if (!rootNode?.children?.length) {
        return [];
    }

    const output: NodeContentOutput[] = [];

    let index = 0;
    for (const node of rootNode.children) {
        index += 1;
        const configuration = configMap.get(node?.type);
        if (isLexicalElement(node)) {
            const parsedElement = parseElement(node as ElementNodeConfig, configMap);
            if (parsedElement) {
                // Default output mapping. In the future this can be implemented as dynamic mapping.
                let elementOutput: NodeContentOutput = {
                    order: index,
                    type: configuration?.elementNode?.outputType || parsedElement.type,
                    text: configuration?.elementNode?.outputTextAsHtml
                        ? parsedElement.html
                        : parsedElement.text
                };

                // Custom output processor callback
                if (configuration) {
                    const outputProcessorCallback = configMap.get(node.type)?.outputTransformer;
                    if (outputProcessorCallback) {
                        elementOutput = outputProcessorCallback(
                            parsedElement,
                            node,
                            index,
                            configuration
                        );
                    }
                }
                output.push(elementOutput);
            }
        }
    }

    return output;
};

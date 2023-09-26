import { ElementNode, LexicalParserConfig } from "~/types";

export const defaultConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "paragraph-element",
                outputType: "paragraph",
                tag: "p",
                outputTextAsHtml: true
            },
            outputProcessor: (
                parsedElement: ElementNode,
                lexicalNode: Record<string, any>,
                index: number,
                config
            ) => {
                // create custom output when paragraph node is matched
                return {
                    order: index,
                    type: config?.elementNode.outputType,
                    text: `<div>${parsedElement.html}</div>`
                };
            }
        },
        {
            elementNode: {
                type: "heading-element",
                outputType: "headings",
                outputTextAsHtml: true
            }
        },
        {
            elementNode: {
                type: "webiny-list",
                outputType: "list",
                outputTextAsHtml: true
            }
        },
        {
            elementNode: {
                type: "webiny-listitem",
                outputType: "list-item",
                tag: "li",
                outputTextAsHtml: true
            }
        },
        {
            elementNode: {
                type: "link",
                outputType: "link",
                tag: "a",
                outputTextAsHtml: true
            },
            htmlProcessor: (parsedElement: ElementNode, linkNode) => {
                console.log("LINK NODE");
                return `<a href="${linkNode?.url}">${parsedElement.text}</a>`;
            }
        }
    ]
};

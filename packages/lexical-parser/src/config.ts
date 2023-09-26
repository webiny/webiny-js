import { LexicalParserConfig } from "~/types";

export const defaultLexicalParserConfig: LexicalParserConfig = {
    processors: [
        {
            elementNode: {
                type: "paragraph-element",
                outputType: "paragraph",
                tag: "p",
                outputTextAsHtml: true
            }
        },
        {
            elementNode: {
                type: "paragraph",
                outputType: "paragraph",
                tag: "p",
                outputTextAsHtml: true
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
                type: "heading",
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
            htmlProcessor: (parsedElement, linkNode) => {
                return `<a href="${linkNode?.url}">${parsedElement.text}</a>`;
            }
        }
    ]
};

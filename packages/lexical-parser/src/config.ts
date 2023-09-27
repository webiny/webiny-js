import { LexicalParserConfig } from "~/types";
import {
    linkHtmlTransformer,
    paragraphHtmlTransformer,
    paragraphTextTransformer
} from "~/transformers";

export const defaultLexicalNodeConfigList: LexicalParserConfig = [
    {
        elementNode: {
            type: "paragraph-element",
            outputType: "paragraph",
            tag: "p",
            outputTextAsHtml: true
        },

        htmlTransformer: paragraphHtmlTransformer,
        textTransformer: paragraphTextTransformer
    },
    {
        elementNode: {
            type: "paragraph", // lexical native node type
            outputType: "paragraph",
            tag: "p",
            outputTextAsHtml: true
        },
        htmlTransformer: paragraphHtmlTransformer,
        textTransformer: paragraphTextTransformer
    },
    {
        elementNode: {
            type: "heading-element",
            outputType: "heading",
            outputTextAsHtml: true
        }
    },
    {
        elementNode: {
            type: "heading", // lexical native node type
            outputType: "heading",
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
            type: "link", // native lexical node type
            outputType: "link",
            tag: "a",
            outputTextAsHtml: true
        },
        htmlTransformer: linkHtmlTransformer
    },
    {
        elementNode: {
            type: "link-node",
            outputType: "link",
            tag: "a",
            outputTextAsHtml: true
        },
        htmlTransformer: linkHtmlTransformer
    },
    {
        elementNode: {
            type: "quote", // lexical native quote type
            outputType: "quote",
            tag: "quoteblock",
            outputTextAsHtml: true
        }
    },
    {
        elementNode: {
            type: "webiny-quote",
            outputType: "quote",
            tag: "quoteblock",
            outputTextAsHtml: true
        }
    }
];

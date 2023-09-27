/**
 * Interfaces for the original lexical nodes
 */

export interface LexicalValue {
    root: { children: Record<string, any>[] };
}

export interface ElementNodeConfig {
    type: string;
    outputType?: string;
    // default output is plain text
    outputTextAsHtml?: boolean;
    // Define specific tag to be applied when element is processed
    tag?: string;
}

export interface LexicalNodeConfig {
    elementNode: ElementNodeConfig;
    htmlTransformer?: (
        parsedElement: ParsedElementNode,
        lexicalNode: Record<string, any>,
        config?: LexicalNodeConfig
    ) => string;

    textTransformer?: (
        parsedElement: ParsedElementNode,
        lexicalNode: Record<string, any>,
        config?: LexicalNodeConfig
    ) => string;
    outputTransformer?: (
        parsedElement: ParsedElementNode,
        lexicalNode: Record<string, any>,
        index: number,
        config?: LexicalNodeConfig
    ) => NodeContentOutput;
}

/**
 * Parsed lexical element node
 */
export interface ParsedElementNode {
    type: string;
    text: string;
    html: string;
    tag: string;
}

export interface NodeContentOutput {
    order?: number;
    type?: string;
    text?: string;
}

export type LexicalParserConfig = LexicalNodeConfig[];

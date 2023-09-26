/**
 * Interfaces for the original lexical nodes
 */

export interface LexicalValue {
    root: { children: Record<string, any>[] };
}

export interface ElementNodeConfig {
    type: string;
    outputType?: string;
    // default output text
    outputTextAsHtml?: boolean;
    // Define specific tag to be applied when element is processed
    tag?: string;
}

export interface LexicalNodeProcessorConfig {
    elementNode: ElementNodeConfig;
    htmlProcessor?: (
        parsedElement: ElementNode,
        lexicalNode: Record<string, any>,
        config?: LexicalNodeProcessorConfig
    ) => string;
    outputProcessor?: (
        parsedElement: ElementNode,
        lexicalNode: Record<string, any>,
        index: number,
        config?: LexicalNodeProcessorConfig
    ) => NodeContentOutput;
}

/**
 * Interface for the parsed nodes
 */

/**
 * Parsed lexical element node
 */
export interface ElementNode {
    type: string;
    text: string;
    html: string;
    tag: string;
}

/**
 * Processors
 */
export interface NodeContentOutput {
    order?: number;
    type?: string;
    text?: string;
}

export interface LexicalParserConfig {
    processors?: LexicalNodeProcessorConfig[];
}

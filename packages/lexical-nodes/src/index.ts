import {
    type Klass,
    type LexicalNode,
    type LexicalNodeReplacement,
    ParagraphNode as BaseParagraphNode
} from "lexical";
import { HeadingNode as BaseHeadingNode, QuoteNode as BaseQuoteNode } from "@lexical/rich-text";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";

import { AutoLinkNode, LinkNode } from "./LinkNode.js";
import { FontColorNode } from "./FontColorNode.js";
import { ListNode } from "./ListNode.js";
import { ListItemNode } from "./ListItemNode.js";
import { HeadingNode } from "./HeadingNode.js";
import { ParagraphNode } from "./ParagraphNode.js";
import { QuoteNode } from "./QuoteNode.js";
import { ImageNode } from "./ImageNode.js";

export * from "./FontColorNode.js";
export * from "./ListNode.js";
export * from "./ListItemNode.js";
export * from "./HeadingNode.js";
export * from "./ParagraphNode.js";
export * from "./QuoteNode.js";
export * from "./ImageNode.js";
export * from "./LinkNode.js";

export * from "./utils/formatList.js";
export * from "./utils/listNode.js";
export * from "./utils/formatToQuote.js";
export * from "./utils/formatToHeading.js";
export * from "./utils/formatToParagraph.js";
export * from "./utils/clearNodeFormating.js";
export * from "./utils/toggleLink.js";
export * from "./prepareLexicalState.js";
export * from "./generateInitialLexicalValue.js";

// This is a list of all the nodes that our Lexical implementation supports OOTB.
export const allNodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> = [
    ParagraphNode,
    {
        replace: BaseParagraphNode,
        with: () => {
            return new ParagraphNode();
        },
        withKlass: ParagraphNode
    },
    HeadingNode,
    {
        replace: BaseHeadingNode,
        with: (node: BaseHeadingNode) => {
            return new HeadingNode(node.getTag());
        },
        withKlass: HeadingNode
    },
    QuoteNode,
    {
        replace: BaseQuoteNode,
        with: () => {
            return new QuoteNode();
        },
        withKlass: QuoteNode
    },
    ImageNode,
    ListNode,
    ListItemNode,
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    OverflowNode,
    MarkNode,
    FontColorNode,
    QuoteNode,
    LinkNode
];

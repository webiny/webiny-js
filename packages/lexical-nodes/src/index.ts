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

import { AutoLinkNode, LinkNode } from "./LinkNode";
import { FontColorNode } from "./FontColorNode";
import { ListNode } from "./ListNode";
import { ListItemNode } from "./ListItemNode";
import { HeadingNode } from "./HeadingNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
import { ImageNode } from "./ImageNode";

export * from "./FontColorNode";
export * from "./ListNode";
export * from "./ListItemNode";
export * from "./HeadingNode";
export * from "./ParagraphNode";
export * from "./QuoteNode";
export * from "./ImageNode";
export * from "./LinkNode";

export * from "./utils/formatList";
export * from "./utils/listNode";
export * from "./utils/formatToQuote";
export * from "./utils/formatToHeading";
export * from "./utils/formatToParagraph";
export * from "./utils/clearNodeFormating";
export * from "./utils/toggleLink";
export * from "./prepareLexicalState";
export * from "./generateInitialLexicalValue";

// This is a list of all the nodes that our Lexical implementation supports OOTB.
export const allNodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> = [
    ParagraphNode,
    {
        replace: BaseParagraphNode,
        with: () => {
            return new ParagraphNode();
        }
    },
    HeadingNode,
    {
        replace: BaseHeadingNode,
        with: (node: BaseHeadingNode) => {
            return new HeadingNode(node.getTag());
        }
    },
    QuoteNode,
    {
        replace: BaseQuoteNode,
        with: () => {
            return new QuoteNode();
        }
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

import { type Klass, type LexicalNode, type LexicalNodeReplacement } from "lexical";
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

// This is a list of all the nodes that our Lexical implementation supports OOTB.
export const allNodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> = [
    ParagraphNode,
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
    HeadingNode,
    QuoteNode,
    LinkNode
];

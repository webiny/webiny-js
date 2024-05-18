import type { Klass, LexicalNode } from "lexical";
import { ParagraphNode as BaseParagraphNode } from "lexical";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { MarkNode } from "@lexical/mark";
import { HeadingNode as BaseHeadingNode, QuoteNode as BaseQuoteNode } from "@lexical/rich-text";
import { OverflowNode } from "@lexical/overflow";

import { AutoLinkNode, LinkNode } from "./LinkNode";
import { FontColorNode } from "./FontColorNode";
import { TypographyNode } from "./TypographyNode";
import { ListNode } from "./ListNode";
import { ListItemNode } from "./ListItemNode";
import { HeadingNode } from "./HeadingNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
import { ImageNode } from "./ImageNode";

export * from "./FontColorNode";
export * from "./TypographyNode";
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
export const allNodes: ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> = [
    // These nodes are copy-pasted from Lexical and modified to fit our needs.
    // https://github.com/facebook/lexical/tree/main/packages/lexical-playground/src/nodes
    // https://github.com/facebook/lexical/tree/main/packages
    ImageNode,
    ListNode,
    ListItemNode,

    // These nodes are directly imported from Lexical.
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    OverflowNode,
    MarkNode,

    // Our custom nodes.
    FontColorNode,
    TypographyNode,

    // The following code replaces the built-in Lexical nodes with our custom ones.
    // https://lexical.dev/docs/concepts/node-replacement
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
    LinkNode
];

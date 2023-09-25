import type { Klass, LexicalNode } from "lexical";
import { ParagraphNode as BaseParagraphNode } from "lexical";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode as BaseLinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { FontColorNode } from "~/nodes/FontColorNode";
import { TypographyElementNode } from "~/nodes/TypographyElementNode";
import { ListNode } from "~/nodes/ListNode";
import { ListItemNode } from "~/nodes/ListItemNode";
import { HeadingNode } from "~/nodes/HeadingNode";
import { ParagraphNode } from "~/nodes/ParagraphNode";
import { HeadingNode as BaseHeadingNode, QuoteNode as BaseQuoteNode } from "@lexical/rich-text";
import { QuoteNode } from "~/nodes/QuoteNode";
import { ImageNode } from "~/nodes/ImageNode";
import { LinkNode } from "~/nodes/LinkNode";

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
    TypographyElementNode,

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
    LinkNode,
    {
        replace: BaseLinkNode,
        with: (node: BaseLinkNode) => {
            return new LinkNode(
                node.getURL(),
                {
                    rel: node.getRel(),
                    title: node.getTitle(),
                    target: node.getTarget()
                },
                node.getKey()
            );
        }
    }
];

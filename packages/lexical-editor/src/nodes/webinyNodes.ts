import type { Klass, LexicalNode } from "lexical";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { FontColorNode } from "~/nodes/FontColorNode";
import { TypographyElementNode } from "~/nodes/TypographyElementNode";
import { ListNode } from "~/nodes/ListNode";
import { ListItemNode } from "~/nodes/ListItemNode";
import { ParagraphNode as BaseParagraphNode } from "lexical";
import { HeadingNode } from "~/nodes/HeadingNode";
import { ParagraphNode } from "~/nodes/ParagraphNode";
import { HeadingNode as BaseHeadingNode, QuoteNode as BaseQuoteNode } from "@lexical/rich-text";
import { QuoteNode } from "~/nodes/QuoteNode";
import { ImageNode } from "~/nodes/ImageNode";

/*
 * This is a list of all the nodes that Webiny's Lexical implementation supports OOTB.
 * */
export const WebinyNodes: ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> = [
    ImageNode,
    ListNode,
    ListItemNode,
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    OverflowNode,
    MarkNode,
    FontColorNode,
    TypographyElementNode,
    /*
     * In order to provide additional Webiny-related functionality, we override Lexical's ParagraphNode and HeadingNode nodes.
     * More info on overriding can be found here: https://lexical.dev/docs/concepts/node-replacement.
     * */
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
    }
];

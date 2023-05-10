import type { Klass, LexicalNode } from "lexical";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HeadingNode } from "@lexical/rich-text";
import { FontColorNode } from "~/nodes/FontColorNode";
import { TypographyElementNode } from "~/nodes/TypographyElementNode";
import { WebinyListNode } from "~/nodes/list-node/WebinyListNode";
import { WebinyListItemNode } from "~/nodes/list-node/WebinyListItemNode";
import { WebinyQuoteNode } from "~/nodes/WebinyQuoteNode";
import { BaseParagraphNode } from "~/nodes/BaseParagraphNode";
import { ParagraphNode } from "lexical";
import { BaseHeadingNode } from "~/nodes/BaseHeadingNode";

export const WebinyNodes: ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> = [
    WebinyListNode,
    WebinyListItemNode,
    WebinyQuoteNode,
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    OverflowNode,
    MarkNode,
    FontColorNode,
    TypographyElementNode,
    BaseParagraphNode,
    {
        replace: ParagraphNode,
        with: () => {
            return new BaseParagraphNode();
        }
    },
    /*
     * We inherit and replace the native HeadingNode, so we can take advantage from the native lexical processing
     * of the node, copy/paste (html cleaning) and provide custom theme styling and behavior to the custom hading node.
     * */
    BaseHeadingNode,
    {
        replace: HeadingNode,
        with: (node: HeadingNode) => {
            return new BaseHeadingNode(node.getTag());
        }
    }
];

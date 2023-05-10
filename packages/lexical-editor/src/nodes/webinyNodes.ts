import type { Klass, LexicalNode } from "lexical";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { FontColorNode } from "~/nodes/FontColorNode";
import { TypographyElementNode } from "~/nodes/TypographyElementNode";
import { WebinyListNode } from "~/nodes/list-node/WebinyListNode";
import { WebinyListItemNode } from "~/nodes/list-node/WebinyListItemNode";
import { BaseQuoteNode } from "~/nodes/BaseQuoteNode";

export const WebinyNodes: ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> = [
    HeadingNode,
    WebinyListNode,
    WebinyListItemNode,
    BaseQuoteNode,
    {
        replace: QuoteNode,
        with: () => {
            return new BaseQuoteNode();
        }
    },
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    OverflowNode,
    MarkNode,
    FontColorNode,
    TypographyElementNode
];

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

export const WebinyNodes: ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> = [
    HeadingNode,
    // Don't forget to register your custom node separately!
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
    TypographyElementNode
];

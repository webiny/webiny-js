import type { Klass, LexicalNode } from "lexical";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { FontColorTextNode } from "~/nodes/FontColorNode";

export const WebinyNodes:
    | Array<Klass<LexicalNode>>
    | {
          replace: Klass<LexicalNode>;
          with: <
              T extends {
                  new (...args: any): any;
              }
          >(
              node: InstanceType<T>
          ) => LexicalNode;
      } = [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
    OverflowNode,
    MarkNode,
    FontColorTextNode
];

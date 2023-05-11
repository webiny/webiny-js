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
    /*
    * We inherit and replace the native ParagraphNode because in this way we can take advantage from the native lexical processing
    * of the node, lib updates, copy/paste from clipboard(html/css cleaning) and
    * provide custom theme styling and behavior on node/DOM creation and update.
    * */
    {

        replace: ParagraphNode,
        with: () => {
            return new BaseParagraphNode();
        }
    }
];

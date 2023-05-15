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
import { ParagraphNode } from "~/nodes/ParagraphNode";
import {ParagraphNode as BaseParagraphNode, TextNode as BaseTextNode} from "lexical";
import {TextNode} from "~/nodes/TextNode";

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
    ParagraphNode,
    {
        replace: BaseTextNode,
        with: (node: BaseTextNode) => {
            return new TextNode(node.getTextContent())
        }
    },
    /*
     * In order to provide additional Webiny-related functionality, we override Lexical's ParagraphNode node.
     * More info on overriding can be found here: https://lexical.dev/docs/concepts/node-replacement.
     * */
    {
        replace: BaseParagraphNode,
        with: () => {
            return new ParagraphNode();
        }
    }
];

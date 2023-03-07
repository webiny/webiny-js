import { Klass, LexicalNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { OverflowNode } from "@lexical/overflow";
import { MarkNode } from "@lexical/mark";
import { FontColorTextNode } from "~/nodes/FontColorNode";

/*
 * @description create nodes
 * */
const nodesFactory = (theme: unknown): Array<Klass<LexicalNode>> => {
    return [
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
};

export const getNodeInstanceWithTheme = (node: LexicalNode, theme: unknown) => {};

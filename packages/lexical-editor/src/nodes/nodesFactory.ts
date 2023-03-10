import { Klass, LexicalNode, TextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { OverflowNode } from "@lexical/overflow";
import { MarkNode } from "@lexical/mark";
import { ThemeStyles } from "@webiny/app-page-builder-elements/types";
import { createFontColorNodeClass } from "~/nodes/FontColorNode";
// import {FontColorAction} from "~/components/ToolbarActions/FontColorAction";

/*
 * @description create nodes
 */
export const nodesFactory = (theme: ThemeStyles): Klass<LexicalNode>[] => {
    const FontAction = createFontColorNodeClass(theme);
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
        FontAction
    ];
};

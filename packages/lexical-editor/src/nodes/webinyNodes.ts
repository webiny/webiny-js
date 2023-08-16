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
import { LinkNode } from "~/nodes/link-node";

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
    /*
     * This custom nodes are copy-pasted from Lexical's code and modified to fit Webiny's needs.
     * PLease check Lexical playground nodes for more information: https://github.com/facebook/lexical/tree/main/packages/lexical-playground/src/nodes
     * Please check Lexical node packages for more information: https://github.com/facebook/lexical/tree/main/packages.
     * */
    ImageNode,
    ListNode,
    ListItemNode,
    /*
     * Direct imports from the Lexical's maintained nodes.
     **/
    CodeNode,
    HashtagNode,
    CodeHighlightNode,
    AutoLinkNode,
    OverflowNode,
    MarkNode,
    /*
     * Custom build Webiny nodes.
     */
    FontColorNode,
    TypographyElementNode,
    /*
     * Node overrides
     *
     * We have improved Webiny's features by extending the node classes from the Lexical core library.
     * In the code below we are registering our extended class separately from the parent classes.
     * Parent classes need to be registered in the "replace" property. In this way, we use the Lexical's "Node overrides"
     *  mechanism to apply our custom node behavior. It's the only way to tell Lexical to use subclasses instead of parent classes.
     *
     * As mentioned in the docs, "Node Overrides" allow you to replace all instances of a given node in your editor with instances of a different node class.
     * Now, for example, our extended  LinkNode instance will replace the BaseLinkNode instance whenever a link is created.
     *
     * We extended following Lexical's maintained nodes:
     * 1. BaseParagraphNode - control the paragraphs (p)
     * 2. BaseHeadingNode - control the headings (h1, h2, h3, etc.)
     * 3. BaseQuoteNode - control how quotes are displayed (blockquote)
     * 4. BaseLinkNode - control the behavior of the links (a)
     *
     * Please check the Lexical documentation for more information on how to override and replace lexical's nodes:
     * https://lexical.dev/docs/concepts/node-replacement
     *
     * Please check the Lexical documentation how you can create custom nodes: https://lexical.dev/docs/concepts/nodes#creating-custom-nodes
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

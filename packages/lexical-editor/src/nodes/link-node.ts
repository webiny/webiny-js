import {
    LinkAttributes,
    LinkNode as BaseLinkNode,
    SerializedAutoLinkNode,
    SerializedLinkNode as BaseSerializedLinkNode
} from "@lexical/link";
import { DOMConversionMap, DOMConversionOutput, EditorConfig, NodeKey, Spread } from "lexical";
import { addClassNamesToElement, isHTMLAnchorElement } from "@lexical/utils";
import { sanitizeUrl } from "~/utils/sanitizeUrl";

export type SerializedLinkNode = Spread<
    {
        type: "link-node";
        version: 1;
    },
    Spread<LinkAttributes, BaseSerializedLinkNode>
>;

export class LinkNode extends BaseLinkNode {
    constructor(url: string, attributes: LinkAttributes = {}, key?: NodeKey) {
        super(url, attributes, key);
    }

    static override getType(): string {
        return "link-node";
    }

    override createDOM(config: EditorConfig): HTMLAnchorElement {
        const element = document.createElement("a");
        element.href = sanitizeUrl(this.__url);
        if (this.__target !== null) {
            element.target = this.__target;
        }
        if (this.__rel !== null) {
            element.rel = this.__rel;
        }
        if (this.__title !== null) {
            element.title = this.__title;
        }
        addClassNamesToElement(element, config.theme.link);
        return element;
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            a: () => ({
                conversion: convertAnchorElement,
                priority: 1
            })
        };
    }

    static override importJSON(
        serializedNode: BaseSerializedLinkNode | SerializedLinkNode | SerializedAutoLinkNode
    ): LinkNode {
        const node = $createLinkNode(serializedNode.url, {
            rel: serializedNode.rel,
            target: serializedNode.target,
            title: serializedNode.title
        });
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): BaseSerializedLinkNode | SerializedLinkNode | SerializedAutoLinkNode {
        return {
            ...super.exportJSON(),
            type: "link-node",
            version: 1
        };
    }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
    let node = null;
    if (isHTMLAnchorElement(domNode)) {
        const content = domNode.textContent;
        if (content !== null && content !== "") {
            node = $createLinkNode(domNode.getAttribute("href") || "", {
                rel: domNode.getAttribute("rel"),
                target: domNode.getAttribute("target"),
                title: domNode.getAttribute("title")
            });
        }
    }
    return { node };
}

export const $isLinkNode = (node: any): node is LinkNode => {
    return node instanceof LinkNode;
};

export const $createLinkNode = (url: string, attributes: LinkAttributes = {}, key?: KeyType) => {
    return new LinkNode(url, attributes, key);
};

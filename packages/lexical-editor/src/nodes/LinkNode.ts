import {
    LinkAttributes,
    LinkNode as BaseLinkNode,
    SerializedLinkNode as BaseSerializedLinkNode
} from "@lexical/link";
import { DOMConversionMap, DOMConversionOutput, EditorConfig, NodeKey, Spread } from "lexical";
import { addClassNamesToElement, isHTMLAnchorElement } from "@lexical/utils";
import { sanitizeUrl } from "~/utils/sanitizeUrl";

export interface LinkNodeAttributes extends LinkAttributes {
    alt?: string;
}

export type SerializedLinkNode = Spread<
    {
        alt?: string;
        type: "link-node";
        version: 1;
    },
    Spread<LinkNodeAttributes, BaseSerializedLinkNode>
>;

export class LinkNode extends BaseLinkNode {
    __alt?: string;

    constructor(url: string, attributes: LinkNodeAttributes, key?: NodeKey) {
        super(url, attributes, key);
        this.__alt = attributes.alt;
    }

    static override getType(): string {
        return "link-node";
    }

    static override clone(node: LinkNode): LinkNode {
        return new LinkNode(
            node.__url,
            { rel: node.__rel, target: node.__target, title: node.__title, alt: node.__alt },
            node.__key
        );
    }

    getAlt(): string | undefined {
        return this.__alt;
    }

    setAlt(text: string): this {
        const self = super.getWritable();
        self.__alt = text;
        return self;
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
        if (this.__alt) {
            element.setAttribute("alt", this.__alt);
        }

        addClassNamesToElement(element, config.theme.link);
        return element;
    }

    override updateDOM(prevNode: LinkNode, dom: HTMLElement): boolean {
        dom.setAttribute("alt", this.__alt ?? "something");
        // Returning false tells Lexical that this node does not need its
        // DOM element replacing with a new copy from createDOM.
        return false;
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            a: () => ({
                conversion: convertAnchorElement,
                priority: 1
            })
        };
    }

    static override importJSON(serializedNode: SerializedLinkNode): LinkNode {
        const node = $createLinkNode(serializedNode.url, {
            rel: serializedNode.rel,
            target: serializedNode.target,
            title: serializedNode.title,
            alt: serializedNode.alt
        });
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);

        if (serializedNode.alt) {
            node.setAlt(serializedNode.alt);
        }
        return node;
    }

    override exportJSON(): SerializedLinkNode {
        return {
            ...super.exportJSON(),
            alt: this.__alt,
            type: "link-node",
            version: 1
        };
    }
}

const convertAnchorElement = (domNode: Node): DOMConversionOutput => {
    let node = null;
    if (isHTMLAnchorElement(domNode)) {
        const content = domNode.textContent;
        if (content !== null && content !== "") {
            node = $createLinkNode(domNode.getAttribute("href") || "", {
                rel: domNode.getAttribute("rel"),
                target: domNode.getAttribute("target"),
                title: domNode.getAttribute("title"),
                alt: domNode.getAttribute("alt") ?? undefined
            });
        }
    }
    return { node };
};

export const $isLinkNode = (node: any): node is LinkNode => {
    return node instanceof LinkNode;
};

export const $createLinkNode = (url: string, attributes: LinkNodeAttributes, key?: KeyType) => {
    return new LinkNode(url, attributes, key);
};

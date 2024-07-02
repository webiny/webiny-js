/** @module @lexical/link */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    DOMConversionMap,
    DOMConversionOutput,
    EditorConfig,
    RangeSelection,
    LexicalCommand,
    LexicalNode,
    NodeKey,
    SerializedElementNode
} from "lexical";

import { addClassNamesToElement, isHTMLAnchorElement } from "@lexical/utils";
import {
    $applyNodeReplacement,
    $isElementNode,
    $isRangeSelection,
    createCommand,
    ElementNode,
    Spread
} from "lexical";

export type LinkAttributes = {
    rel?: null | string;
    target?: null | string;
    title?: null | string;
    alt?: null | string;
};

declare global {
    interface HTMLAnchorElement {
        alt?: string;
    }
}

export type SerializedLinkNode = Spread<
    {
        url: string;
    },
    Spread<LinkAttributes, SerializedElementNode>
>;

const SUPPORTED_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "sms:", "tel:"]);

/** @noInheritDoc */
export class LinkNode extends ElementNode {
    /** @internal */
    __url: string;
    /** @internal */
    __target: null | string;
    /** @internal */
    __rel: null | string;
    /** @internal */
    __title: null | string;
    /** @internal */
    __alt: null | string;

    static override getType(): string {
        return "link";
    }

    static override clone(node: LinkNode): LinkNode {
        return new LinkNode(
            node.__url,
            { rel: node.__rel, target: node.__target, title: node.__title, alt: node.__alt },
            node.__key
        );
    }

    constructor(url: string, attributes: LinkAttributes = {}, key?: NodeKey) {
        super(key);
        const { target = null, rel = null, title = null, alt = null } = attributes;
        this.__url = url;
        this.__target = target;
        this.__rel = rel;
        this.__title = title;
        this.__alt = alt;
    }

    override createDOM(config: EditorConfig): HTMLAnchorElement {
        const element = document.createElement("a") as HTMLAnchorElement;
        element.href = this.sanitizeUrl(this.__url);
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

    override updateDOM(prevNode: LinkNode, anchor: HTMLAnchorElement): boolean {
        const url = this.__url;
        const target = this.__target;
        const rel = this.__rel;
        const title = this.__title;
        const alt = this.__alt;

        if (url !== prevNode.__url) {
            anchor.href = url;
        }

        if (target !== prevNode.__target) {
            if (target) {
                anchor.target = target;
            } else {
                anchor.removeAttribute("target");
            }
        }

        if (rel !== prevNode.__rel) {
            if (rel) {
                anchor.rel = rel;
            } else {
                anchor.removeAttribute("rel");
            }
        }

        if (title !== prevNode.__title) {
            if (title) {
                anchor.title = title;
            } else {
                anchor.removeAttribute("title");
            }
        }

        if (alt !== prevNode.__alt) {
            if (alt) {
                anchor.setAttribute("alt", alt);
            } else {
                anchor.removeAttribute("alt");
            }
        }

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

    static override importJSON(
        serializedNode: SerializedLinkNode | SerializedAutoLinkNode
    ): LinkNode {
        const node = $createLinkNode(serializedNode.url, {
            rel: serializedNode.rel,
            target: serializedNode.target,
            title: serializedNode.title,
            alt: serializedNode.alt
        });
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    sanitizeUrl(url: string): string {
        try {
            const parsedUrl = new URL(url);
            // eslint-disable-next-line no-script-url
            if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
                return "about:blank";
            }
        } catch {
            return url;
        }
        return url;
    }

    override exportJSON(): SerializedLinkNode | SerializedAutoLinkNode {
        return {
            ...super.exportJSON(),
            rel: this.getRel(),
            target: this.getTarget(),
            title: this.getTitle(),
            alt: this.getAlt(),
            type: "link",
            url: this.getURL(),
            version: 1
        };
    }

    getURL(): string {
        return this.getLatest().__url;
    }

    setURL(url: string): void {
        const writable = this.getWritable();
        writable.__url = url;
    }

    getTarget(): null | string {
        return this.getLatest().__target;
    }

    setTarget(target: null | string): void {
        const writable = this.getWritable();
        writable.__target = target;
    }

    getRel(): null | string {
        return this.getLatest().__rel;
    }

    setRel(rel: null | string): void {
        const writable = this.getWritable();
        writable.__rel = rel;
    }

    getTitle(): null | string {
        return this.getLatest().__title;
    }

    setTitle(title: null | string): void {
        const writable = this.getWritable();
        writable.__title = title;
    }

    getAlt(): string | null {
        return this.__alt;
    }

    setAlt(text: string | null): void {
        const writable = super.getWritable();
        writable.__alt = text;
    }

    override insertNewAfter(
        selection: RangeSelection,
        restoreSelection = true
    ): null | ElementNode {
        const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection);
        if ($isElementNode(element)) {
            const linkNode = $createLinkNode(this.__url, {
                rel: this.__rel,
                target: this.__target,
                title: this.__title,
                alt: this.__alt
            });
            element.append(linkNode);
            return linkNode;
        }
        return null;
    }

    override canInsertTextBefore(): false {
        return false;
    }

    override canInsertTextAfter(): false {
        return false;
    }

    override canBeEmpty(): false {
        return false;
    }

    override isInline(): true {
        return true;
    }

    override extractWithChild(_: LexicalNode, selection: RangeSelection): boolean {
        if (!$isRangeSelection(selection)) {
            return false;
        }

        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();

        return (
            this.isParentOf(anchorNode) &&
            this.isParentOf(focusNode) &&
            selection.getTextContent().length > 0
        );
    }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
    let node = null;
    if (isHTMLAnchorElement(domNode)) {
        const content = domNode.textContent;
        if ((content !== null && content !== "") || domNode.children.length > 0) {
            node = $createLinkNode(domNode.getAttribute("href") || "", {
                rel: domNode.getAttribute("rel"),
                target: domNode.getAttribute("target"),
                title: domNode.getAttribute("title"),
                alt: domNode.getAttribute("alt")
            });
        }
    }
    return { node };
}

/**
 * Takes a URL and creates a LinkNode.
 * @param url - The URL the LinkNode should direct to.
 * @param attributes - Optional HTML a tag attributes { target, rel, title }
 * @returns The LinkNode.
 */
export function $createLinkNode(url: string, attributes?: LinkAttributes): LinkNode {
    return $applyNodeReplacement(new LinkNode(url, attributes));
}

/**
 * Determines if node is a LinkNode.
 * @param node - The node to be checked.
 * @returns true if node is a LinkNode, false otherwise.
 */
export function $isLinkNode(node: LexicalNode | null | undefined): node is LinkNode {
    return node instanceof LinkNode;
}

export type SerializedAutoLinkNode = SerializedLinkNode;

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link
export class AutoLinkNode extends LinkNode {
    static override getType(): string {
        return "autolink";
    }

    static override clone(node: AutoLinkNode): AutoLinkNode {
        return new AutoLinkNode(
            node.__url,
            { rel: node.__rel, target: node.__target, title: node.__title },
            node.__key
        );
    }

    static override importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
        const node = $createAutoLinkNode(serializedNode.url, {
            rel: serializedNode.rel,
            target: serializedNode.target,
            title: serializedNode.title
        });
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    static override importDOM(): null {
        // TODO: Should link node should handle the import over autolink?
        return null;
    }

    override exportJSON(): SerializedAutoLinkNode {
        return {
            ...super.exportJSON(),
            type: "autolink",
            version: 1
        };
    }

    override insertNewAfter(
        selection: RangeSelection,
        restoreSelection = true
    ): null | ElementNode {
        const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection);
        if ($isElementNode(element)) {
            const linkNode = $createAutoLinkNode(this.__url, {
                rel: this.__rel,
                target: this.__target,
                title: this.__title
            });
            element.append(linkNode);
            return linkNode;
        }
        return null;
    }
}

/**
 * Takes a URL and creates an AutoLinkNode. AutoLinkNodes are generally automatically generated
 * during typing, which is especially useful when a button to generate a LinkNode is not practical.
 * @param url - The URL the LinkNode should direct to.
 * @param attributes - Optional HTML a tag attributes. { target, rel, title }
 * @returns The LinkNode.
 */
export function $createAutoLinkNode(url: string, attributes?: LinkAttributes): AutoLinkNode {
    return $applyNodeReplacement(new AutoLinkNode(url, attributes));
}

/**
 * Determines if node is an AutoLinkNode.
 * @param node - The node to be checked.
 * @returns true if node is an AutoLinkNode, false otherwise.
 */
export function $isAutoLinkNode(node: LexicalNode | null | undefined): node is AutoLinkNode {
    return node instanceof AutoLinkNode;
}

export const TOGGLE_LINK_COMMAND: LexicalCommand<
    string | ({ url: string } & LinkAttributes) | null
> = createCommand("TOGGLE_LINK_COMMAND");

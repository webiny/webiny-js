/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { Suspense } from "react";
import type {
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";

const ImageComponent = React.lazy(() => {
    return import(
        /* webpackChunkName: "lexical-image" */
        "./components/ImageNode/ImageComponent.js"
    );
});

export type SerializedImageNode = Spread<
    {
        id: string;
        altText: string;
        height?: number;
        maxWidth: number;
        src: string;
        width?: number;
    },
    SerializedLexicalNode
>;

export interface ImageNodeProps {
    id: string;
    src: string;
    altText: string;
    maxWidth: number;
    width?: "inherit" | number;
    height?: "inherit" | number;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
    __id: string;
    __src: string;
    __altText: string;
    __width: "inherit" | number;
    __height: "inherit" | number;
    __maxWidth: number;

    static override getType(): string {
        return "wby-image";
    }

    static override clone(node: ImageNode): ImageNode {
        return new ImageNode(
            {
                id: node.__id,
                src: node.__src,
                altText: node.__altText,
                maxWidth: node.__maxWidth,
                width: node.__width,
                height: node.__height
            },
            node.__key
        );
    }

    static override importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { id, altText, height, width, maxWidth, src } = serializedNode;
        return $createImageNode({
            id,
            altText,
            height,
            maxWidth,
            src,
            width
        });
    }

    override exportDOM(): DOMExportOutput {
        const element = document.createElement("img");
        element.setAttribute("id", this.__id);
        element.setAttribute("src", this.__src);
        element.setAttribute("alt", this.__altText);
        element.setAttribute("width", this.__width.toString());
        element.setAttribute("height", this.__height.toString());
        return { element };
    }

    /**
     * Control how an HTMLElement is represented in Lexical.
     * DOM data comes from clipboard or parsing HTML to nodes with the available lexical functions.
     * (@see @lexical/html package: https://github.com/facebook/lexical/blob/main/packages/lexical-html/README.md).
     */
    static override importDOM(): DOMConversionMap | null {
        /**
         * By returning 'null' value, we are preventing image node to be created.
         * Example of how to implement and create the node:
         * https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/nodes/ImageNode.tsx#L94
         */
        return null;
    }

    constructor(props: ImageNodeProps, key?: NodeKey) {
        super(key);
        this.__id = props.id;
        this.__src = props.src;
        this.__altText = props.altText;
        this.__maxWidth = props.maxWidth;
        this.__width = props.width || "inherit";
        this.__height = props.height || "inherit";
    }

    override exportJSON(): SerializedImageNode {
        return {
            id: this.__id,
            src: this.getSrc(),
            altText: this.getAltText(),
            width: this.__width === "inherit" ? 0 : this.__width,
            height: this.__height === "inherit" ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            type: this.getType(),
            version: 1
        };
    }

    setWidthAndHeight(width: "inherit" | number, height: "inherit" | number): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    // View
    override createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement("span");
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    override updateDOM(): false {
        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    getAltText(): string {
        return this.__altText;
    }

    override decorate(): JSX.Element {
        return (
            <Suspense fallback={null}>
                <ImageComponent
                    id={this.__id}
                    src={this.__src}
                    altText={this.__altText}
                    width={this.__width}
                    height={this.__height}
                    maxWidth={this.__maxWidth}
                    nodeKey={this.getKey()}
                    resizable={true}
                />
            </Suspense>
        );
    }
}

export function $createImageNode(props: ImageNodeProps, key?: string): ImageNode {
    return $applyNodeReplacement(new ImageNode(props, key));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}

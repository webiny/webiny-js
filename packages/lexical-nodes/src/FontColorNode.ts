import type { EditorConfig, LexicalNode, SerializedTextNode, Spread } from "lexical";
import { $getSelection, $isRangeSelection, createCommand, TextNode } from "lexical";
import { Theme } from "@webiny/lexical-theme";
import { isCanonicalPath } from "@webiny/theme-common/canonical/index.js";
import { toCssVariableName } from "@webiny/theme-common/naming/cssVariable.js";

export class ThemeColorValue {
    /**
     * Identifies where the colour came from. Three cases:
     *
     * - `"custom"` — a literal the author typed.
     * - a design token path (`color.text.primary`) — a reference into the active theme's canonical
     *   slots. These render through their CSS variable, so existing content follows theme changes.
     * - any other id — a legacy project-defined theme colour (`color1`), kept working unchanged.
     */
    private readonly id: string;
    // This can be a HEX value or a CSS variable.
    private value: string;

    constructor(value: string, name?: string) {
        this.value = value;
        this.id = name ?? "custom";
    }

    getValue() {
        return this.value;
    }

    getName() {
        return this.id;
    }

    /** True when this colour is a reference into the Theme app's canonical slots. */
    isDesignToken() {
        return this.id !== "custom" && isCanonicalPath(this.id);
    }

    /**
     * The value to put on the DOM.
     *
     * A design token renders as `var(--wby-…, <cached literal>)`. The variable is what makes
     * already-published content follow a theme change; the fallback is what keeps it rendering if
     * the theme is later deactivated, when the variable would otherwise resolve to nothing and the
     * browser would drop the declaration entirely.
     */
    getCssValue() {
        if (!this.isDesignToken()) {
            return this.value;
        }

        const variable = toCssVariableName(this.id);
        return this.value ? `var(${variable}, ${this.value})` : `var(${variable})`;
    }

    updateFromTheme(theme: Theme) {
        if (theme.colors && this.id !== "custom") {
            const color = theme.colors.find(color => color.id === this.id);
            if (color) {
                this.value = color.value;
            }
        }
    }
}

export const ADD_FONT_COLOR_COMMAND = createCommand<FontColorPayload>("ADD_FONT_COLOR_COMMAND");

const FontColorNodeAttrName = "data-theme-font-color-name";

/** Carries a design token path on exported HTML, so the reference survives the round trip. */
const TokenAttrName = "data-wby-token";

export interface FontColorPayload {
    color: ThemeColorValue;
}

export type SerializedFontColorNode = Spread<
    {
        themeColor: string;
        color: string;
        type: "wby-font-color";
    },
    SerializedTextNode
>;

/**
 * Main responsibility of this node is to apply custom or Webiny theme color to selected text.
 * Extends the original TextNode node to add additional transformation and support for webiny theme font color.
 */
export class FontColorNode extends TextNode {
    private readonly __color: ThemeColorValue;

    constructor(text: string, color: ThemeColorValue, key?: string) {
        super(text, key);
        this.__color = color;
    }

    static override getType(): string {
        return "wby-font-color";
    }

    static override clone(node: FontColorNode): FontColorNode {
        return new FontColorNode(node.__text, node.__color, node.__key);
    }

    static override importJSON(serializedNode: SerializedFontColorNode): TextNode {
        const node = new FontColorNode(
            serializedNode.text,
            new ThemeColorValue(serializedNode.color, serializedNode.themeColor)
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    override splitText(...splitOffsets: Array<number>): Array<FontColorNode> {
        const newNodes = super.splitText(...splitOffsets);

        const selection = $getSelection();

        // After splitting, we need to re-apply styling to the new TextNodes.
        const fontColorNodes = newNodes.map(node => {
            if (node instanceof FontColorNode) {
                return node;
            }

            const fontColorNode = $createFontColorNode(node.getTextContent(), this.__color);
            $applyStylesToNode(fontColorNode, this);

            const newNode = node.replace(fontColorNode);

            // Since we're replacing the existing node, we need to update the selection keys.
            // This is very important to not break the editor functionality!
            if ($isRangeSelection(selection)) {
                const anchor = selection.anchor;
                const focus = selection.focus;

                if (anchor.key === node.getKey()) {
                    anchor.key = newNode.getKey();
                }

                if (focus.key === node.getKey()) {
                    focus.key = newNode.getKey();
                }
            }

            return newNode;
        });

        return fontColorNodes as Array<FontColorNode>;
    }

    override exportJSON(): SerializedFontColorNode {
        return {
            ...super.exportJSON(),
            themeColor: this.__color.getName(),
            color: this.__color.getValue(),
            type: "wby-font-color"
        };
    }

    /**
     * Writes the colour onto an element.
     *
     * Both attributes are emitted on purpose. `data-theme-font-color-name` is long-standing and
     * anything consuming exported HTML may already read it, so it stays. `data-wby-token` is added
     * only for design-token references, and is what lets a themed consumer recover the reference
     * from exported HTML rather than being stuck with the resolved literal.
     */
    private applyColorTo(element: HTMLElement, theme: Theme): HTMLElement {
        this.__color.updateFromTheme(theme);

        element.setAttribute(FontColorNodeAttrName, this.__color.getName());

        if (this.__color.isDesignToken()) {
            element.setAttribute(TokenAttrName, this.__color.getName());
        } else {
            element.removeAttribute(TokenAttrName);
        }

        element.style.color = this.__color.getCssValue();
        return element;
    }

    override updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        this.applyColorTo(dom, Theme.from(config.theme));
        return isUpdated;
    }

    getColorStyle() {
        return {
            color: this.__color.getValue(),
            themeColor: this.__color.getName()
        };
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        return this.applyColorTo(element, Theme.from(config.theme));
    }
}

export const $createFontColorNode = (text: string, color: ThemeColorValue): FontColorNode => {
    return new FontColorNode(text, color);
};

export const $isFontColorNode = (node: LexicalNode): node is FontColorNode => {
    return node instanceof FontColorNode;
};

export function $applyStylesToNode(node: TextNode, source: TextNode) {
    node.setFormat(source.getFormat());
    node.setStyle(source.getStyle());
}

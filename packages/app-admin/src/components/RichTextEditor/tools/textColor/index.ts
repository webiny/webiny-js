import { API } from "@editorjs/editorjs";

/**
 * Build styles
 */
require("./index.css").toString();

class TextColorTool {
    _state: boolean;
    color: string;
    api: API;
    tag: string;
    class: string;
    colorPicker: HTMLDivElement;
    button: HTMLButtonElement;
    config: {
        themeColors: string[];
    };
    _CSS: any;

    constructor({ api, config }) {
        this.api = api;
        this.button = null;
        this._state = false;
        this.tag = "SPAN";
        this.color = "red";
        this.class = "cdx-text-color";
        this.config = config || { themeColors: ["#44bd32"] };
        this._CSS = {
            colorPicker: "ce-text-color-tool",
            colorBox: "ce-text-color-tool__color-box",
            colorBoxActive: "ce-text-color-tool__color-box--active"
        };
    }

    static get isInline() {
        return true;
    }

    static get sanitize() {
        return {
            span: {
                class: "cdx-text-color"
            }
        };
    }

    get state() {
        return this._state;
    }

    set state(state) {
        this._state = state;

        this.button.classList.toggle(this.api.styles.inlineToolButtonActive, state);
    }

    render() {
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.innerHTML =
            '<svg width="20" height="18"><path d="M10.458 12.04l2.919 1.686-.781 1.417-.984-.03-.974 1.687H8.674l1.49-2.583-.508-.775.802-1.401zm.546-.952l3.624-6.327a1.597 1.597 0 0 1 2.182-.59 1.632 1.632 0 0 1 .615 2.201l-3.519 6.391-2.902-1.675zm-7.73 3.467h3.465a1.123 1.123 0 1 1 0 2.247H3.273a1.123 1.123 0 1 1 0-2.247z"/></svg>';
        this.button.classList.add(this.api.styles.inlineToolButton);

        return this.button;
    }

    /**
     * Input for the link
     */
    public renderActions(): HTMLElement {
        // Create action element
        this.colorPicker = document.createElement("div");
        // Add element properties
        this.colorPicker.classList.add(this._CSS.colorPicker);

        this.config.themeColors.forEach(color => {
            // create element
            const colorBox = document.createElement("button");
            // add properties
            colorBox.style.backgroundColor = color;
            colorBox.classList.add(this._CSS.colorBox);

            colorBox.addEventListener("click", () => {
                if (this.color === color) {
                    // reset the color
                    this.color = "unset";
                } else {
                    // set color
                    this.color = color;
                }

                this.colorPicker.childNodes.forEach((node: HTMLElement) => {
                    if (node.classList.contains(this._CSS.colorBoxActive)) {
                        // remove active class
                        node.classList.remove(this._CSS.colorBoxActive);
                    }
                });
                // add active class
                colorBox.classList.add(this._CSS.colorBoxActive);
            });
            // save element
            this.colorPicker.appendChild(colorBox);
        });

        // Return element
        return this.colorPicker;
    }

    surround(range) {
        if (this.state) {
            this.unwrap(range);
            return;
        }

        this.wrap(range);
    }

    wrap(range) {
        const selectedText = range.extractContents();
        const mark = document.createElement(this.tag);

        mark.classList.add(this.class);
        // Add color
        // mark.style.color = this.color;

        mark.appendChild(selectedText);
        range.insertNode(mark);

        this.api.selection.expandToTag(mark);
    }

    unwrap(range) {
        const mark = this.api.selection.findParentTag(this.tag, this.class);
        const text = range.extractContents();

        mark.remove();

        range.insertNode(text);
    }

    showActions(mark) {
        this.colorPicker.onclick = () => {
            mark.style.color = this.color;
        };
        this.colorPicker.hidden = false;
    }

    hideActions() {
        this.colorPicker.onchange = null;
        this.colorPicker.hidden = true;
    }

    checkState() {
        const mark = this.api.selection.findParentTag(this.tag);

        this.state = !!mark;

        if (this.state) {
            this.showActions(mark);
        } else {
            this.hideActions();
        }
    }

    convertToHex(color) {
        const rgb = color.match(/(\d+)/g);

        let hexR = parseInt(rgb[0]).toString(16);
        let hexG = parseInt(rgb[1]).toString(16);
        let hexB = parseInt(rgb[2]).toString(16);

        hexR = hexR.length === 1 ? "0" + hexR : hexR;
        hexG = hexG.length === 1 ? "0" + hexG : hexG;
        hexB = hexB.length === 1 ? "0" + hexB : hexB;

        return "#" + hexR + hexG + hexB;
    }

    clear() {
        this.hideActions();
    }
}

export default TextColorTool;

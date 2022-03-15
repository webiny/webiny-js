import { API, PasteEvent } from "@editorjs/editorjs";
import { Alignment, ALIGNMENTS, TextAlign, ALIGNMENT_ICONS } from "../utils";
import { HTMLPasteEventDetail } from "@editorjs/editorjs/types/tools/paste-events";

/**
 * @typedef {object} ParagraphConfig
 * @property {string} placeholder - placeholder for the empty paragraph
 * @property {boolean} preserveBlank - Whether or not to keep blank paragraphs when saving editor data`
 */
interface ParagraphConfig {
    placeholder: string;
    preserveBlank: boolean;
    typography?: Typography;
}
/**
 * @typedef {Object} ParagraphData
 * @description Tool's input and output data format
 * @property {String} text — Paragraph's content. Can include HTML tags: <a><b><i>
 */
interface ParagraphData {
    text: string;
    textAlign: TextAlign;
    className?: string;
}

interface Typography {
    [key: string]: {
        label: string;
        component: string;
        className: string;
    };
}

interface ParagraphArgs {
    data: ParagraphData;
    config: ParagraphConfig;
    api: any;
    readOnly: boolean;
}
class Paragraph {
    private readonly api: API;
    private readonly readOnly: boolean;
    private readonly _CSS: any;
    // private readonly _settings: any;
    private _data: ParagraphData;
    private readonly _element: any;
    private readonly _placeholder: string;
    private readonly _preserveBlank: boolean;
    private readonly alignments: Alignment[];
    private readonly settingsButtons: HTMLElement[];
    private readonly typography: Typography | null;

    /**
     * Render plugin`s main Element and fill it with saved data
     *
     * @param {object} params - constructor params
     * @param {ParagraphData} params.data - previously saved data
     * @param {ParagraphConfig} params.config - user config for Tool
     * @param {object} params.api - editor.js api
     * @param {boolean} readOnly - read only mode flag
     */
    public constructor({ data, config, api, readOnly }: ParagraphArgs) {
        this.api = api;
        this.readOnly = readOnly;
        this.typography = config.typography || null;
        this._CSS = {
            block: this.api.styles.block,
            settingsButton: this.api.styles.settingsButton,
            settingsButtonActive: this.api.styles.settingsButtonActive,
            wrapper: "ce-paragraph"
        };

        if (!this.readOnly) {
            this.onKeyUp = this.onKeyUp.bind(this);
        }

        /**
         * Placeholder for paragraph if it is first Block
         * @type {string}
         */
        this._placeholder = config.placeholder ? config.placeholder : Paragraph.DEFAULT_PLACEHOLDER;
        this._data = this.normalizeData(data);
        this._element = this.drawView();
        this._preserveBlank = config.preserveBlank !== undefined ? config.preserveBlank : false;
        this.settingsButtons = [];
        this.alignments = ALIGNMENTS;

        // Call the `data` setter, to properly render the view element.
        this.data = this._data;
    }

    /**
     * Default placeholder for Paragraph Tool
     *
     * @return {string}
     * @constructor
     */
    public static get DEFAULT_PLACEHOLDER(): string {
        return "";
    }

    /**
     * Enable Conversion Toolbar. Paragraph can be converted to/from other tools
     */
    public static get conversionConfig() {
        return {
            export: "text", // to convert Paragraph to other block, use 'text' property of saved data
            import: "text" // to covert other block's exported string to Paragraph, fill 'text' property of tool data
        };
    }

    /**
     * Sanitizer rules
     */
    public static get sanitize() {
        return {
            text: {
                br: true
            }
        };
    }

    /**
     * Returns true to notify the core that read-only mode is supported
     *
     * @return {boolean}
     */
    public static get isReadOnlySupported(): boolean {
        return true;
    }

    /**
     * Get current Tools`s data
     * @returns {ParagraphData} Current data
     * @private
     */
    public get data(): ParagraphData {
        const text = this._element.innerHTML;

        // this._data.text = text;

        return {
            ...this._data,
            text
        };
    }

    /**
     * Store data in plugin:
     * - at the this._data property
     * - at the HTML
     *
     * @param {ParagraphData} data — data to set
     * @private
     */
    public set data(data: ParagraphData) {
        this._data = data || ({} as ParagraphData);

        this._element.innerHTML = this._data.text || "";

        /**
         * Add Alignment class
         */
        this.alignments.forEach(alignment => {
            if (alignment.name === this._data.textAlign) {
                this._element.classList.add(`ce-header-text--${alignment.name}`);
            } else {
                this._element.classList.remove(`ce-header-text--${alignment.name}`);
            }
        });

        /**
         * Add Typography class
         */
        if (this._data.className) {
            this._element.classList.add(...this._data.className.split(" "));
        }
    }

    /**
     * Used by Editor paste handling API.
     * Provides configuration to handle P tags.
     *
     * @returns {{tags: string[]}}
     */
    public static get pasteConfig() {
        return {
            tags: ["P"]
        };
    }

    /**
     * Icon and title for displaying at the Toolbox
     *
     * @return {{icon: string, title: string}}
     */
    public static get toolbox() {
        return {
            icon:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.2 -0.3 9 11.4" width="12" height="14">\n' +
                '  <path d="M0 2.77V.92A1 1 0 01.2.28C.35.1.56 0 .83 0h7.66c.28.01.48.1.63.28.14.17.21.38.21.64v1.85c0 .26-.08.48-.23.66-.15.17-.37.26-.66.26-.28 0-.5-.09-.64-.26a1 1 0 01-.21-.66V1.69H5.6v7.58h.5c.25 0 .45.08.6.23.17.16.25.35.25.6s-.08.45-.24.6a.87.87 0 01-.62.22H3.21a.87.87 0 01-.61-.22.78.78 0 01-.24-.6c0-.25.08-.44.24-.6a.85.85 0 01.61-.23h.5V1.7H1.73v1.08c0 .26-.08.48-.23.66-.15.17-.37.26-.66.26-.28 0-.5-.09-.64-.26A1 1 0 010 2.77z"/>\n' +
                "</svg>",
            title: "Text"
        };
    }

    /**
     * Get current alignment
     *
     * @returns {alignment}
     */
    public get currentAlignment(): Alignment {
        let alignment = this.alignments.find(alignment => alignment.name === this._data.textAlign);

        if (!alignment) {
            alignment = { name: TextAlign.START, svg: ALIGNMENT_ICONS.start };
        }

        return alignment;
    }

    /**
     * Check if text content is empty and set empty string to inner html.
     * We need this because some browsers (e.g. Safari) insert <br> into empty contentEditable elements
     *
     * @param {KeyboardEvent} e - key up event
     */
    public onKeyUp(e: KeyboardEvent): void {
        if (e.code !== "Backspace" && e.code !== "Delete") {
            return;
        }

        const { textContent } = this._element;

        if (textContent === "") {
            this._element.innerHTML = "";
        }
    }

    /**
     * Create Tool's view
     * @return {HTMLElement}
     * @private
     */
    public drawView(): HTMLElement {
        const div: HTMLDivElement = document.createElement("div");
        div.classList.add(this._CSS.wrapper, this._CSS.block);
        // Add custom className to view.
        if (this._data.className) {
            div.classList.add(this._data.className);
        }
        div.contentEditable = "false";
        div.dataset["placeholder"] = this.api.i18n.t(this._placeholder);

        if (!this.readOnly) {
            div.contentEditable = "true";
            div.addEventListener("keyup", this.onKeyUp);
        }

        return div;
    }

    /**
     * Return Tool's view
     */
    public render(): HTMLDivElement {
        return this._element;
    }

    /**
     * Create Block's settings block
     */
    public renderSettings(): HTMLElement {
        const holder: HTMLDivElement = document.createElement("div");

        // Add alignment selectors
        this.alignments.forEach(alignment => {
            const selectTypeButton: HTMLSpanElement = document.createElement("span");

            selectTypeButton.classList.add(this._CSS.settingsButton);

            /**
             * Highlight current level button
             */
            if (this.currentAlignment.name === alignment.name) {
                selectTypeButton.classList.add(this._CSS.settingsButtonActive);
            }

            /**
             * Add SVG icon
             */
            selectTypeButton.innerHTML = alignment.svg;

            /**
             * Save alignment to its button
             */
            selectTypeButton.dataset["textAlign"] = alignment.name;

            /**
             * Set up click handler
             */
            selectTypeButton.addEventListener("click", () => {
                this.setAlignment(alignment);
            });

            /**
             * Append settings button to holder
             */
            holder.appendChild(selectTypeButton);

            /**
             * Save settings buttons
             */
            this.settingsButtons.push(selectTypeButton);
        });

        // Add `Typography` selector
        if (this.typography) {
            const typographyForParagraph = Object.values(this.typography).filter(
                item => item.component === "p"
            );

            const selectTypeButton = document.createElement("SELECT") as HTMLSelectElement;
            // Add editor's default input style
            selectTypeButton.classList.add(this.api.styles.input);
            // Add typography options
            typographyForParagraph.forEach(item => {
                const option = new Option(item.label, item.className);

                selectTypeButton.appendChild(option);
            });
            // Add "onclick" handler
            selectTypeButton.onclick = event => {
                const { value } = event.target as HTMLSelectElement;
                this.setTypographyClass(value);
            };

            /**
             * Append settings button to holder
             */
            holder.appendChild(selectTypeButton);

            /**
             * Save settings buttons
             */
            this.settingsButtons.push(selectTypeButton);
        }

        return holder;
    }

    /**
     * Method that specified how to merge two Text blocks.
     * Called by Editor.js by backspace at the beginning of the Block
     * @param {ParagraphData} data
     * @public
     */
    public merge(data: ParagraphData): void {
        this.data = {
            ...this.data,
            text: this.data.text + data.text
        };
    }

    /**
     * Validate Paragraph block data:
     * - check for emptiness
     *
     * @param {ParagraphData} savedData — data received after saving
     * @returns {boolean} false if saved data is not correct, otherwise true
     * @public
     */
    public validate(savedData: ParagraphData): boolean {
        return !(savedData.text.trim() === "" && !this._preserveBlank);
    }

    /**
     * Extract Tool's data from the view
     * @param {HTMLDivElement} toolsContent - Paragraph tools rendered view
     * @returns {ParagraphData} - saved data
     * @public
     */
    public save(toolsContent: HTMLElement) {
        return {
            text: toolsContent.innerHTML,
            textAlign: this.getTextAlign(toolsContent.className),
            className: this.data.className
        };
    }

    /**
     * Extract textAlign from className
     *
     * @param {string} className - heading element className
     * @returns {TextAlign} textAlign
     */
    public getTextAlign(className: string): TextAlign {
        let textAlign = TextAlign.START;
        // Match className with alignment
        this.alignments.forEach(alignment => {
            if (className.includes(`ce-header-text--${alignment.name}`)) {
                textAlign = alignment.name;
            }
        });
        return textAlign;
    }

    /**
     * On paste callback fired from Editor.
     *
     * @param {PasteEvent} event - event with pasted data
     */
    public onPaste(event: PasteEvent): void {
        const detail = event.detail as HTMLPasteEventDetail;
        this.data = {
            ...this.data,
            text: detail.data.innerHTML
        };
    }

    /**
     * Callback for Block's settings buttons
     *
     * @param {number} alignment - level to set
     */
    public setAlignment(alignment: Alignment): void {
        this.data = {
            textAlign: alignment.name,
            text: this.data.text
        };

        /**
         * Highlight button by selected level
         */
        this.settingsButtons.forEach(button => {
            button.classList.toggle(
                this._CSS.settingsButtonActive,
                button.dataset["textAlign"] === alignment.name
            );
        });
    }

    /**
     * Callback for Block's settings buttons
     *
     * @param {string} className - name of typography class
     */
    public setTypographyClass(className: string): void {
        this.data = {
            textAlign: this.data.textAlign,
            text: this.data.text,
            className: className
        };
    }

    /**
     * Normalize input data
     *
     * @param {HeaderData} data - saved data to process
     *
     * @returns {HeaderData}
     * @private
     */
    public normalizeData(data?: Partial<ParagraphData>): ParagraphData {
        const newData: Partial<ParagraphData> = {};

        if (typeof data !== "object") {
            data = {};
        }

        newData.text = data.text || "";
        newData.textAlign = data.textAlign || TextAlign.START;
        newData.className = data.className || "";

        return newData as ParagraphData;
    }
}

export default Paragraph;

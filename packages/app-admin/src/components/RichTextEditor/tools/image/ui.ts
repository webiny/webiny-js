import { API } from "@editorjs/editorjs";
import { ImageToolConfig, ImageToolData } from "./types";

interface OnSelectFileCallable {
    (): void;
}
interface UiStatus {
    EMPTY: "empty";
    FILLED: "filled";
    [key: string]: string;
}
interface UiParams {
    api: API;
    config: ImageToolConfig;
    onSelectFile: OnSelectFileCallable;
    readOnly: boolean;
}
/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
    private api: API;
    private config: ImageToolConfig;
    private readonly readOnly: boolean;
    private readonly onSelectFile: OnSelectFileCallable;

    public readonly nodes: {
        wrapper: HTMLElement;
        imageContainer: HTMLElement;
        fileButton: HTMLElement;
        imageEl?: HTMLElement;
        caption: HTMLElement;
    };

    /**
     * @param ui - image tool Ui module
     * @param ui.api - Editor.js API
     * @param ui.config - user config
     * @param ui.onSelectFile - callback for clicks on Select file button
     * @param ui.readOnly - read-only mode flag
     */
    constructor({ api, config, onSelectFile, readOnly }: UiParams) {
        this.api = api;
        this.config = config;
        this.onSelectFile = onSelectFile;
        this.readOnly = readOnly;
        this.nodes = {
            wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
            imageContainer: make("div", [this.CSS.imageContainer]),
            fileButton: this.createFileButton(),
            imageEl: undefined,
            caption: make("div", [this.CSS.input, this.CSS.caption], {
                contentEditable: !this.readOnly
            })
        };

        /**
         * Create base structure
         *  <wrapper>
         *    <image-container/>
         *    <caption />
         *  </wrapper>
         */
        this.nodes.caption.dataset["placeholder"] = this.config.captionPlaceholder;
        this.nodes.wrapper.appendChild(this.nodes.imageContainer);
        this.nodes.wrapper.appendChild(this.nodes.caption);
        this.nodes.wrapper.appendChild(this.nodes.fileButton);
    }

    /**
     * CSS classes
     *
     * @returns {object}
     */
    get CSS() {
        return {
            baseClass: this.api.styles.block,
            input: this.api.styles.input,
            button: this.api.styles.button,

            /**
             * Tool's classes
             */
            wrapper: "image-tool",
            imageContainer: "image-tool__image",
            imageEl: "image-tool__image-picture",
            caption: "image-tool__caption"
        };
    }

    /**
     * Ui statuses:
     * - empty
     * - filled
     *
     * @returns {{EMPTY: string, UPLOADING: string, FILLED: string}}
     */
    static get status(): UiStatus {
        return {
            EMPTY: "empty",
            FILLED: "filled"
        };
    }

    /**
     * Renders tool UI
     *
     * @param {ImageToolData} toolData - saved tool data
     * @returns {Element}
     */
    render(toolData: ImageToolData) {
        if (!toolData.file || Object.keys(toolData.file).length === 0) {
            this.toggleStatus(Ui.status.EMPTY);
        }

        return this.nodes.wrapper;
    }

    /**
     * Creates upload-file button
     *
     * @returns {Element}
     */
    createFileButton() {
        const button = make("div", [this.CSS.button]);

        button.innerHTML = this.api.i18n.t("Select an Image");

        button.addEventListener("click", () => {
            this.onSelectFile();
        });

        return button;
    }

    /**
     * Shows an image
     *
     * @param {string} url - image source
     * @returns {void}
     */
    public fillImage(url: string): void {
        /**
         * Check for a source extension to compose element correctly: video tag for mp4, img — for others
         */
        const tag = /\.mp4$/.test(url) ? "VIDEO" : "IMG";

        const attributes: any = {
            src: url
        };

        /**
         * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
         * - IMG: load
         * - VIDEO: loadeddata
         *
         * @type {string}
         */
        let eventName = "load";

        /**
         * Update attributes and eventName if source is a mp4 video
         */
        if (tag === "VIDEO") {
            /**
             * Add attributes for playing muted mp4 as a gif
             *
             * @type {boolean}
             */
            attributes.autoplay = true;
            attributes.loop = true;
            attributes.muted = true;
            attributes.playsinline = true;

            /**
             * Change event to be listened
             *
             * @type {string}
             */
            eventName = "loadeddata";
        }

        /**
         * Compose tag with defined attributes
         *
         * @type {Element}
         */
        this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

        /**
         * Add load event listener
         */
        this.nodes.imageEl.addEventListener(eventName, () => {
            this.toggleStatus(Ui.status.FILLED);
        });

        this.nodes.imageContainer.appendChild(this.nodes.imageEl);
    }

    /**
     * Shows caption input
     *
     * @param {string} text - caption text
     * @returns {void}
     */
    public fillCaption(text: string): void {
        if (!this.nodes.caption) {
            return;
        }
        this.nodes.caption.innerHTML = text;
    }

    /**
     * Changes UI status
     *
     * @param {string} status - see {@link Ui.status} constants
     * @returns {void}
     */
    public toggleStatus(status: string): void {
        for (const statusType in Ui.status) {
            if (Object.prototype.hasOwnProperty.call(Ui.status, statusType) === false) {
                continue;
            }
            const newStatus = Ui.status[statusType];
            this.nodes.wrapper.classList.toggle(
                `${this.CSS.wrapper}--${newStatus}`,
                status === newStatus
            );
        }
    }

    /**
     * Apply visual representation of activated tune
     *
     * @param {string} tuneName - one of available tunes {@link Tunes.tunes}
     * @param {boolean} status - true for enable, false for disable
     * @returns {void}
     */
    public applyTune(tuneName: string, status: boolean) {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
    }
}

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {Array|string} classNames  - list or name of CSS class
 * @param  {object} attributes        - any attributes
 * @returns {HTMLElement}
 */
export const make = function make(
    tagName: string,
    classNames: string[] | string | null = null,
    attributes?: Record<string, string | number | boolean>
): HTMLElement {
    const element: HTMLElement = document.createElement(tagName);

    if (Array.isArray(classNames)) {
        element.classList.add(...classNames);
    } else if (classNames) {
        element.classList.add(classNames);
    }

    if (!attributes) {
        return element;
    }
    for (const attrName in attributes) {
        /**
         * Unfortunately it is a problem to map attributes to element because element is complaining
         * that attrName is a string, which cannot index the HTMLElement
         */
        const key = attrName as keyof HTMLElement;
        /**
         * Error says that each key is a read-only property.
         */
        // @ts-expect-error
        element[key] = attributes[attrName];
    }

    return element;
};

// @ts-nocheck

import "./index.scss";
import Ui from "./ui";
import Tunes from "./tunes";
import svgs from "./svgs";

export default class ImageTool {
    /**
     * Notify core that read-only mode is supported
     *
     * @returns {boolean}
     */
    static get isReadOnlySupported() {
        return true;
    }

    /**
     * Get Tool toolbox settings
     * icon - Tool icon's SVG
     * title - title to show in toolbox
     *
     * @returns {{icon: string, title: string}}
     */
    static get toolbox() {
        return {
            icon: svgs.toolbox,
            title: "Image"
        };
    }

    constructor({ data, config, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;

        this.config = {
            actions: config.actions || [],
            showFileManager: config.showFileManager
        };

        /**
         * Module for working with UI
         */
        this.ui = new Ui({
            api,
            config: this.config,
            onSelectFile: () => {
                this.config.showFileManager(file => {
                    this.image = file;
                });
            },
            readOnly
        });

        /**
         * Module for working with tunes
         */
        this.tunes = new Tunes({
            api,
            actions: this.config.actions,
            onChange: tuneName => this.tuneToggled(tuneName)
        });

        /**
         * Set saved state
         */
        this._data = {};
        this.data = data;
    }

    /**
     * Renders Block content
     *
     * @public
     *
     * @returns {HTMLDivElement}
     */
    render() {
        return this.ui.render(this.data);
    }

    /**
     * Return Block data
     *
     * @public
     *
     * @returns {ImageToolData}
     */
    save() {
        const caption = this.ui.nodes.caption;

        this._data.caption = caption.innerHTML;

        return this.data;
    }

    /**
     * Makes buttons with tunes: stretch image
     *
     * @public
     *
     * @returns {Element}
     */
    renderSettings() {
        return this.tunes.render(this.data);
    }

    /**
     * Stores all Tool's data
     *
     * @private
     *
     * @param {ImageToolData} data - data in Image Tool format
     */
    set data(data) {
        this.image = data.file;

        this._data.caption = data.caption || "";
        this.ui.fillCaption(this._data.caption);

        Tunes.tunes.forEach(({ name: tune }) => {
            const value =
                typeof data[tune] !== "undefined"
                    ? data[tune] === true || data[tune] === "true"
                    : false;

            this.setTune(tune, value);
        });
    }

    /**
     * Return Tool data
     *
     * @private
     *
     * @returns {ImageToolData}
     */
    get data() {
        return this._data;
    }

    /**
     * Set new image file
     *
     * @private
     *
     * @param {object} file - uploaded file data
     */
    set image(file) {
        this._data.file = file || {};

        if (file && file.src) {
            this.ui.fillImage(file.src);
        }
    }

    /**
     * Callback fired when Block Tune is activated
     *
     * @private
     *
     * @param {string} tuneName - tune that has been clicked
     * @returns {void}
     */
    tuneToggled(tuneName) {
        // inverse tune state
        this.setTune(tuneName, !this._data[tuneName]);
    }

    /**
     * Set one tune
     *
     * @param {string} tuneName - {@link Tunes.tunes}
     * @param {boolean} value - tune state
     * @returns {void}
     */
    setTune(tuneName, value) {
        this._data[tuneName] = value;

        this.ui.applyTune(tuneName, value);

        if (tuneName === "stretched") {

            /**
             * Wait until the API is ready
             */
            Promise.resolve()
                .then(() => {
                    const blockId = this.api.blocks.getCurrentBlockIndex();

                    this.api.blocks.stretchBlock(blockId, value);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }
}

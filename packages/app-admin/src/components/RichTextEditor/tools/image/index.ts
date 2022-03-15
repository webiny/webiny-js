import { API } from "@editorjs/editorjs";
import Ui from "./ui";
import Tunes from "./tunes";
import svgs from "./svgs";
import { Tune } from "./types";

interface File {
    src: string;
}
interface GetFileSourceCallable {
    (file: File | string): string;
}
const defaultGetFileSrc: GetFileSourceCallable = file => {
    if (typeof file === "string") {
        return file;
    }

    return file.src;
};
interface OnSelectFileCallable {
    (file: File): string;
}
const defaultOnSelectFile: OnSelectFileCallable = file => {
    return file.src;
};

interface ImageToolData {
    caption: string;
    file: string;
}
interface ImageToolParams {
    data: ImageToolData;
    config: Config;
    api: API;
    readOnly: boolean;
}
interface Config {
    getFileSrc: GetFileSourceCallable;
    onSelectFile: OnSelectFileCallable;
    actions: Tune[];
    context: {
        showFileManager: (cb: (file: File) => void) => void;
    };
}
export default class ImageTool {
    private readonly api: API;
    private readonly readOnly: boolean;
    private readonly config: Config;
    private readonly tunes: Tunes;
    private readonly ui: Ui;
    private readonly _data: any;

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

    constructor({ data, config, api, readOnly }: ImageToolParams) {
        this.api = api;
        this.readOnly = readOnly;

        this.config = {
            getFileSrc: config.getFileSrc || defaultGetFileSrc,
            onSelectFile: config.onSelectFile || defaultOnSelectFile,
            actions: config.actions || [],
            context: config.context
        };

        /**
         * Module for working with UI
         */
        this.ui = new Ui({
            api,
            config: this.config,
            onSelectFile: () => {
                this.config.context.showFileManager((file: File) => {
                    this.image = this.config.onSelectFile(file);
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
            onChange: (tuneName: string) => this.tuneToggled(tuneName)
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

        Tunes.tunes.forEach(({ name }) => {
            const tune = name as keyof ImageToolData;

            const initialValue = data[tune] as unknown as string | boolean;

            const value = initialValue === true || initialValue === "true";

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
    get data(): ImageToolData {
        return this._data;
    }

    /**
     * Set new image file
     *
     * @private
     *
     * @param {object} file - uploaded file data
     */
    set image(file: File | string) {
        this._data.file = file || {};

        if (file) {
            this.ui.fillImage(this.config.getFileSrc(file));
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
    public tuneToggled(tuneName: string): void {
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
    public setTune(tuneName: string, value: boolean): void {
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

    public isReadOnly(): boolean {
        return this.readOnly;
    }
}

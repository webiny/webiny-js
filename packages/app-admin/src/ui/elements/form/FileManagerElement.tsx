import { UIElement } from "~/ui/UIElement";
import { FormFieldElement, FormFieldElementConfig } from "./FormFieldElement";
import { FileManagerElementRenderer } from "./FileManagerElement/FileManagerElementRenderer";
import { EmptyStateElement } from "./FileManagerElement/EmptyStateElement";

export interface FileManagerElementConfig extends FormFieldElementConfig {
    // Define mime types that will be shown and accepted by FileManager
    accept?: string[];

    // Define file's max allowed size (default is "10mb").
    // Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
    maxSize?: number | string;

    // Max number of files in a single batch.
    multipleMaxCount?: number;

    // Max size of files in a single batch.
    multipleMaxSize?: number | string;

    // Define properties that are returned on file(s) selection.
    onChangePickAttributes?: string[];

    // Define whether multiple files can be selected1.
    // TODO: multiple?: boolean; - create a new renderer for "multiple=true" to render multiple files
    // It should work as in Headless CMS content entry form, see that for an example.
}

export class FileManagerElement extends FormFieldElement<FileManagerElementConfig> {
    private readonly _emptyStateElement: UIElement;

    public constructor(id: string, config: FileManagerElementConfig) {
        super(id, config);

        this.addRenderer(new FileManagerElementRenderer());

        this._emptyStateElement = new EmptyStateElement("emptyState");

        this.applyPlugins(FileManagerElement);
    }

    public getEmptyStateElement() {
        return this._emptyStateElement;
    }

    public getAccept() {
        return this.config.accept;
    }

    public setAccept(accept: string[]) {
        this.config.accept = accept;
    }

    public getMaxSize() {
        return this.config.maxSize;
    }

    public setMaxSize(maxSize: number | string) {
        this.config.maxSize = maxSize;
    }

    public getMultipleMaxCount() {
        return this.config.multipleMaxCount;
    }

    public setMultipleMaxCount(multipleMaxCount: number) {
        this.config.multipleMaxCount = multipleMaxCount;
    }

    public getMultipleMaxSize() {
        return this.config.multipleMaxSize;
    }

    public setMultipleMaxSize(multipleMaxSize: number | string) {
        this.config.multipleMaxSize = multipleMaxSize;
    }

    public getOnChangePickAttributes() {
        return this.config.onChangePickAttributes;
    }

    public setOnChangePickAttributes(attributes: string[]) {
        this.config.onChangePickAttributes = attributes;
    }
}

import React from "react";
import bytes from "bytes";
import minimatch from "minimatch";
import { readFileContent } from "./utils/readFileContent";
import { generateId } from "./utils/generateId";

export type SelectedFile = {
    id: string;
    name: string;
    type: string;
    size: number;
    src: {
        file: File;
        base64: string | null;
    };
};

export type FileError = {
    id: string;
    type:
        | "unsupportedFileType"
        | "maxSizeExceeded"
        | "multipleMaxSizeExceeded"
        | "multipleMaxCountExceeded"
        | "multipleNotAllowed";
    index?: number;
    file?: SelectedFile | File;
    multipleFileSize?: number;
    multipleMaxSize?: number;
    multipleMaxCount?: number;
    multipleCount?: number;
};

export type BrowseFilesParams = {
    onSuccess?: (files: SelectedFile[]) => void;
    onError?: (errors: FileError[], files: SelectedFile[]) => void;
};

export type RenderPropParams = {
    browseFiles: (params: BrowseFilesParams) => void;
    getDropZoneProps: (additionalProps: any) => any;
    getLabelProps: (additionalProps: any) => any;
    validateFiles: (files: SelectedFile[] | File[]) => FileError[];
};

export type FilesRules = {
    accept: string[];
    multiple: boolean;
    maxSize: string;
    multipleMaxSize: string;
    multipleMaxCount: number | null;
    convertToBase64: boolean;
    onSuccess?: (files: SelectedFile[]) => void;
    onError?: (errors: FileError[], files: SelectedFile[]) => void;
};

export type Props = FilesRules & {
    children: (params: RenderPropParams) => React.ReactNode;
    id?: string;
};

export class Files extends React.Component<Props> {
    static defaultProps = {
        accept: [],
        multiple: false,
        maxSize: "2mb",
        multipleMaxSize: "10mb",
        multipleMaxCount: null,
        convertToBase64: false
    };

    input: HTMLInputElement | null = null;
    browseFilesPassedParams: BrowseFilesParams | null = null;
    id: string = generateId();

    validateFiles = (files: SelectedFile[] | File[]): FileError[] => {
        const { multiple, multipleMaxSize, multipleMaxCount, accept, maxSize } = this.props;

        const errors: FileError[] = [];
        let multipleFileSize = 0;

        if (!multiple && files.length > 1) {
            errors.push({
                id: generateId(),
                type: "multipleNotAllowed"
            });

            return errors;
        }

        for (let index = 0; index < files.length; index++) {
            const file = files[index];

            if (
                Array.isArray(accept) &&
                accept.length &&
                !accept.some(type => minimatch(file.type, type))
            ) {
                errors.push({
                    id: generateId(),
                    index,
                    file,
                    type: "unsupportedFileType"
                });
            } else if (maxSize) {
                if (file.size > bytes(maxSize)) {
                    errors.push({
                        id: generateId(),
                        index,
                        file,
                        type: "maxSizeExceeded"
                    });
                }
            }

            if (multiple) {
                multipleFileSize += file.size;
            }
        }

        if (multiple) {
            if (multipleMaxSize && multipleFileSize > bytes(multipleMaxSize)) {
                errors.push({
                    id: generateId(),
                    type: "multipleMaxSizeExceeded",
                    multipleFileSize,
                    multipleMaxSize: bytes(multipleMaxSize)
                });
            }

            if (multipleMaxCount && files.length > multipleMaxCount) {
                errors.push({
                    id: generateId(),
                    type: "multipleMaxCountExceeded",
                    multipleCount: files.length,
                    multipleMaxCount
                });
            }
        }

        return errors;
    };

    processSelectedFiles = async (eventFiles: Array<File>) => {
        if (eventFiles.length === 0) {
            return;
        }

        const { convertToBase64, onSuccess, onError } = this.props;
        const { browseFilesPassedParams } = this;
        const callbacks = {
            onSuccess,
            onError
        };

        if (browseFilesPassedParams && browseFilesPassedParams.onSuccess) {
            callbacks.onSuccess = browseFilesPassedParams.onSuccess;
        }

        if (browseFilesPassedParams && browseFilesPassedParams.onError) {
            callbacks.onError = browseFilesPassedParams.onError;
        }

        const files: SelectedFile[] = [...eventFiles].map(file => {
            return {
                id: generateId(),
                name: file.name,
                type: file.type,
                size: file.size,
                src: {
                    file,
                    base64: null
                }
            };
        });

        const errors = this.validateFiles(files);

        if (errors.length) {
            callbacks.onError && callbacks.onError(errors, files);
        } else {
            if (convertToBase64) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i].src.file;
                    files[i].src.base64 = await readFileContent(file);
                }
            }

            callbacks.onSuccess && callbacks.onSuccess(files);
        }

        // Reset the browseFiles arguments.
        if (this.input) {
            this.input.value = "";
        }
        this.browseFilesPassedParams = null;
    };

    /**
     * Extracted into a separate method just for testing purposes.
     */
    onDropFilesHandler = async ({ e, onSuccess, onError }: any) => {
        this.browseFilesPassedParams = { onSuccess, onError };
        e.dataTransfer &&
            e.dataTransfer.files &&
            (await this.processSelectedFiles(e.dataTransfer.files));
    };

    /**
     * Extracted into a separate method just for testing purposes.
     */
    browseFilesHandler = ({ onSuccess, onError }: any) => {
        this.browseFilesPassedParams = { onSuccess, onError };
        this.input && this.input.click();
    };

    override render() {
        const { multiple, accept, id } = this.props;
        return (
            <React.Fragment>
                {this.props.children({
                    getLabelProps: (props: any) => {
                        return {
                            ...props,
                            htmlFor: id || this.id
                        };
                    },
                    validateFiles: this.validateFiles,
                    browseFiles: ({ onSuccess, onError }: BrowseFilesParams = {}) => {
                        this.browseFilesHandler({ onSuccess, onError });
                    },
                    getDropZoneProps: ({
                        onSuccess,
                        onError,
                        onDragOver,
                        onDrop,
                        ...rest
                    }: any = {}) => {
                        return {
                            ...rest,
                            onDragOver: (e: DragEvent) => {
                                e.preventDefault();
                                typeof onDragOver === "function" && onDragOver();
                            },
                            onDrop: async (e: DragEvent) => {
                                e.preventDefault();
                                typeof onDrop === "function" && onDrop();
                                this.onDropFilesHandler({ e, onSuccess, onError });
                            }
                        };
                    }
                })}

                <input
                    id={id || this.id}
                    ref={ref => {
                        if (ref) {
                            this.input = ref;
                        }
                    }}
                    accept={accept.join(",")}
                    style={{ display: "none" }}
                    type="file"
                    multiple={multiple}
                    onChange={e =>
                        this.processSelectedFiles((e.target.files as any as Array<File>) ?? [])
                    }
                />
            </React.Fragment>
        );
    }
}

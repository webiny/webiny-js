import bytes from "bytes";
import { minimatch } from "minimatch";
import { generateId, readFileContent } from "./utils.js";
import type {
    BrowserFilePickerConfig,
    SelectedFile,
    FileError,
    BrowseFilesParams
} from "./types.js";

async function resolveTypeFromName(fileName: string): Promise<string> {
    const mime = await import("mime");
    return mime.default.getType(fileName) || "";
}

export class BrowserFilePickerPresenter {
    private readonly config: BrowserFilePickerConfig;

    constructor(config: BrowserFilePickerConfig) {
        this.config = config;
    }

    validateFiles(files: Array<{ type: string; size: number }>): FileError[] {
        const { multiple, multipleMaxSize, multipleMaxCount, accept, maxSize } = this.config;
        const errors: FileError[] = [];
        let multipleFileSize = 0;

        if (!multiple && files.length > 1) {
            errors.push({ id: generateId(), type: "multipleNotAllowed" });
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
                    file: file as SelectedFile | File,
                    type: "unsupportedFileType"
                });
            } else if (maxSize) {
                const sizeAsBytes = bytes(maxSize);
                if (sizeAsBytes && file.size > sizeAsBytes) {
                    errors.push({
                        id: generateId(),
                        index,
                        file: file as SelectedFile | File,
                        type: "maxSizeExceeded"
                    });
                }
            }

            if (multiple) {
                multipleFileSize += file.size;
            }
        }

        if (multiple) {
            const maxMultipleMaxSize = bytes(multipleMaxSize);

            if (maxMultipleMaxSize && multipleMaxSize && multipleFileSize > maxMultipleMaxSize) {
                errors.push({
                    id: generateId(),
                    type: "multipleMaxSizeExceeded",
                    multipleFileSize,
                    multipleMaxSize: maxMultipleMaxSize
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
    }

    async processFiles(rawFiles: File[], callbacks: BrowseFilesParams): Promise<void> {
        if (rawFiles.length === 0) {
            return;
        }

        const files: SelectedFile[] = await Promise.all(
            [...rawFiles].map(async file => {
                const mimeType =
                    file.type !== "" ? file.type : await resolveTypeFromName(file.name);

                return {
                    id: generateId(),
                    name: file.name,
                    type: mimeType,
                    size: file.size,
                    src: { file, base64: null }
                };
            })
        );

        const errors = this.validateFiles(files);

        if (errors.length && callbacks.onError) {
            callbacks.onError(errors, files);
            return;
        }

        if (this.config.convertToBase64) {
            for (let i = 0; i < files.length; i++) {
                files[i].src.base64 = await readFileContent(files[i].src.file);
            }
        }

        if (callbacks.onSuccess) {
            callbacks.onSuccess(files);
        }
    }
}

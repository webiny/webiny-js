import bytes from "bytes";
import { FileError as BaseFileError } from "react-butterfiles";

interface FileError extends BaseFileError {
    multipleMaxCount: number;
    multipleMaxSize: number;
}

export const outputFileSelectionError = (errors: FileError[]): string | null => {
    if (errors.length > 1) {
        let error = errors.find(error => error.type === "multipleMaxCountExceeded");
        if (error) {
            return `Cannot upload more than ${error.multipleMaxCount} files at once.`;
        }

        error = errors.find(error => error.type === "multipleMaxSizeExceeded");
        if (error) {
            return `Cannot upload more than ${bytes.format(error.multipleMaxSize)} at once.`;
        }

        return "Multiple invalid files selected.";
    }

    switch (errors[0].type) {
        case "unsupportedFileType":
            return "Unsupported file type.";
        case "maxSizeExceeded":
            return "Max size exceeded.";
        case "multipleMaxCountExceeded":
            return "Multiple max files exceeded.";
        case "multipleMaxSizeExceeded":
            return "Multiple max size exceeded.";
        case "multipleNotAllowed":
            return "Only one file allowed.";
        default:
            return null;
    }
};

export interface SelectedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    src: {
        file: File;
        base64: string | null;
    };
}

export interface FileError {
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
}

export interface BrowseFilesParams {
    onSuccess?: (files: SelectedFile[]) => void;
    onError?: (errors: FileError[], files: SelectedFile[]) => void;
}

export interface BrowserFilePickerRenderProps {
    browseFiles: (params?: BrowseFilesParams) => void;
    getDropZoneProps: (additionalProps?: Record<string, any>) => Record<string, any>;
    getLabelProps: (additionalProps?: Record<string, any>) => Record<string, any>;
    validateFiles: (files: Array<{ type: string; size: number }>) => FileError[];
}

export interface BrowserFilePickerConfig {
    accept: string[];
    multiple: boolean;
    maxSize: string;
    multipleMaxSize: string;
    multipleMaxCount: number | null;
    convertToBase64: boolean;
}

export interface BrowserFilePickerProps {
    children: (params: BrowserFilePickerRenderProps) => React.ReactNode;
    id?: string;
    accept?: string[];
    multiple?: boolean;
    maxSize?: string;
    multipleMaxSize?: string;
    multipleMaxCount?: number | null;
    convertToBase64?: boolean;
    onSuccess?: (files: SelectedFile[]) => void;
    onError?: (errors: FileError[], files: SelectedFile[]) => void;
}

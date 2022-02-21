interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
    };
    [key: string]: any;
}
declare module "react-butterfiles" {
    export type SelectedFile = {
        id: string;
        name: string;
        type: string;
        size: number;
        src: {
            file?: FileItem;
            base64?: string;
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
        file?: SelectedFile | File;
    };

    export type BrowseFilesParams = {
        onSuccess?: (files: SelectedFile[]) => void;
        onError?: (errors: FileError[], files: SelectedFile[]) => void;
    };

    export type FilesRenderChildren = {
        browseFiles: (params?: BrowseFilesParams) => void;
        getDropZoneProps: (additionalProps?: Object) => Object;
        getLabelProps(additionalProps?: Object): Object;
        validateFiles(files: Array<SelectedFile> | Array<File>): Array<FileError>;
    };

    export type FilesRules = {
        accept: string[];
        multiple?: boolean;
        maxSize?: number | string;
        multipleMaxSize?: number | string;
        multipleMaxCount?: number;
        convertToBase64?: boolean;
        onSuccess?: (files: SelectedFile[]) => void;
        onError?: (errors: FileError[], files: SelectedFile[]) => void;
    };

    export type FilesProps = FilesRules & {
        children(params: FilesRenderChildren): React.ReactNode;
        id?: string;
    };

    const Files: React.ComponentType<FilesProps>;

    export default Files;
}

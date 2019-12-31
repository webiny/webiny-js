declare module "*.svg" {
    import * as React from "react";

    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

    const src: string;
    export default src;
}

declare module "*.md" {
    const content: string;
    export default content;
}

declare const Caman: any;

declare module "react-butterfiles" {
    export type SelectedFile = {
        id: string;
        name: string;
        type: string;
        size: number;
        src: {
            file?: File;
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

    export type RenderPropParams = {
        browseFiles: (params: BrowseFilesParams) => void;
        getDropZoneProps: (additionalProps?: Object) => Object;
        getLabelProps: (additionalProps?: Object) => Object;
    };

    export type FilesRules = {
        accept: string[];
        multiple?: boolean;
        maxSize?: string;
        multipleMaxSize?: string;
        multipleMaxCount?: number;
        convertToBase64?: boolean;
        onSuccess?: (files: SelectedFile[]) => void;
        onError?: (errors: FileError[], files: SelectedFile[]) => void;
    };

    export type Props = FilesRules & {
        children: (params: RenderPropParams) => React.ReactNode;
        id?: string;
    };

    const Files: React.ComponentType<Props>;

    export default Files;
}

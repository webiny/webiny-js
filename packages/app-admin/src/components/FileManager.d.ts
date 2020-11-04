import * as React from "react";
declare type FileManagerProps = {
    onChange?: Function;
    images?: boolean;
    multiple?: boolean;
    accept?: Array<string>;
    children: ({ showFileManager: Function }: {
        showFileManager: any;
    }) => React.ReactNode;
    maxSize?: number | string;
    multipleMaxCount?: number;
    multipleMaxSize?: number | string;
    onClose?: Function;
};
export declare function FileManager({ children, ...rest }: FileManagerProps): JSX.Element;
export {};

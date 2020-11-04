/// <reference types="react" />
declare function FileManagerProvider({ children, ...props }: {
    [x: string]: any;
    children: any;
}): JSX.Element;
declare function useFileManager(): {
    selected: any;
    toggleSelected(file: any): void;
    hasPreviouslyUploadedFiles: any;
    setHasPreviouslyUploadedFiles(hasPreviouslyUploadedFiles: any): void;
    queryParams: any;
    setQueryParams(queryParams: any): void;
    setDragging(state?: boolean): void;
    dragging: any;
    setUploading(state?: boolean): void;
    uploading: any;
    showFileDetails(src: any): void;
    hideFileDetails(): void;
    showingFileDetails: any;
    state: any;
    dispatch: any;
};
export { FileManagerProvider, useFileManager };

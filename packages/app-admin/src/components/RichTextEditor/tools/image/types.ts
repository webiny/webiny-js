export interface TuneOnChangeCallable {
    (tune: string): boolean | void;
}
export interface Tune {
    name: string;
    icon: string;
    title: string;
    action?: TuneOnChangeCallable;
}

export interface ImageToolData {
    caption: string;
    file: string;
}
export interface ImageToolFile {
    src: string;
}
export interface GetFileSourceCallable {
    (file: ImageToolFile | string): string;
}
export interface OnSelectFileCallable {
    (file: ImageToolFile): string;
}
export interface ImageToolConfig {
    getFileSrc: GetFileSourceCallable;
    onSelectFile: OnSelectFileCallable;
    captionPlaceholder?: string;
    actions: Tune[];
    context: Record<string, any>;
}

export interface FileUrlParams {
    width?: number;
    [key: string]: unknown;
}

export interface FileUrlFormatter {
    format(url: URL, params?: FileUrlParams): void;
}

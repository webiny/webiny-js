export interface FileUrlParams {
    width?: number;
    [key: string]: unknown;
}

export interface FileUrlFormatter {
    format(url: URL | string, params?: FileUrlParams): string;
}

export const defaultFileUrlFormatter: FileUrlFormatter = {
    format(url: URL | string): string {
        return url.toString();
    }
};

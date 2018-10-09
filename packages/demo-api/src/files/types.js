// @flow
export type FilesServiceFile = {
    src: Buffer,
    type: string
};

export type ImageOptions = {
    width?: number,
    height?: number
};

export type FileOptions = Object & ImageOptions;

export type CreateFileResponse = {
    name: string,
    size: number,
    type: string,
    src: string
};

export type FilesServicePlugin = {
    create: (src: string) => Promise<CreateFileResponse>,
    read: (src: string, options?: FileOptions) => Promise<FilesServiceFile>
};

import type { IUnzipperFile } from "~/tasks/utils/decompressor";

export interface ICompressedFileReader {
    read(target: string): Promise<IUnzipperFile[]>;
}

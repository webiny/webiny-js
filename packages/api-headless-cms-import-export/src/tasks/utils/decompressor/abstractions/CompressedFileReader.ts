import { UnzipperFile } from "~/tasks/utils/decompressor";

export interface ICompressedFileReader {
    read(target: string): Promise<UnzipperFile[]>;
}

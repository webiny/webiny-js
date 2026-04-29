import { createAbstraction } from "@webiny/feature/api/index.js";
import type { CmsModelField } from "~/types/index.js";

export interface IModelFieldCompressionCompressResult {
    compression: string;
    value: string;
}

export interface IModelFieldCompression {
    compress(fields: CmsModelField[]): Promise<IModelFieldCompressionCompressResult>;
    decompress(
        data: IModelFieldCompressionCompressResult | CmsModelField[] | unknown
    ): Promise<CmsModelField[]>;
}

export const ModelFieldCompression = createAbstraction<IModelFieldCompression>(
    "Cms/Model/FieldCompression"
);

export namespace ModelFieldCompression {
    export type Interface = IModelFieldCompression;
    export type CompressParams = CmsModelField[];
    export type CompressResponse = Promise<IModelFieldCompressionCompressResult>;
    export type DecompressParams = IModelFieldCompressionCompressResult | CmsModelField[] | unknown;
    export type DecompressResponse = Promise<CmsModelField[]>;
}

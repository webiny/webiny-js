import { createAbstraction } from "@webiny/feature/api";

export interface TextExtractorResult {
    text: string;
}

export interface ITextExtractor {
    canExtract(mimeType: string): boolean;
    extract(buffer: Buffer, mimeType: string): Promise<TextExtractorResult>;
}

export const TextExtractor = createAbstraction<ITextExtractor>("TextExtractor");

export namespace TextExtractor {
    export type Interface = ITextExtractor;
    export type Result = TextExtractorResult;
}

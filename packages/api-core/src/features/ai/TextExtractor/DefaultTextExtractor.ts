import { TextExtractor, type TextExtractorResult } from "./abstractions.js";
import { extractPdfText } from "./parsers/pdfParser.js";
import { extractDocxText } from "./parsers/docxParser.js";

const TEXT_MIME_PREFIX = "text/";

const SUPPORTED_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/json"
]);

class TextExtractorImpl implements TextExtractor.Interface {
    canExtract(mimeType: string): boolean {
        return mimeType.startsWith(TEXT_MIME_PREFIX) || SUPPORTED_MIME_TYPES.has(mimeType);
    }

    async extract(buffer: Buffer, mimeType: string): Promise<TextExtractorResult> {
        if (mimeType.startsWith(TEXT_MIME_PREFIX) || mimeType === "application/json") {
            return { text: buffer.toString("utf-8") };
        }

        if (mimeType === "application/pdf") {
            return { text: await extractPdfText(buffer) };
        }

        if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            return { text: await extractDocxText(buffer) };
        }

        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
}

export const DefaultTextExtractor = TextExtractor.createImplementation({
    implementation: TextExtractorImpl,
    dependencies: []
});

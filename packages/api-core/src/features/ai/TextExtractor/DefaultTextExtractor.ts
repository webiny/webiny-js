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
        console.log(`[TextExtractor] Extracting text from ${mimeType} (${buffer.length} bytes)`);

        if (mimeType.startsWith(TEXT_MIME_PREFIX) || mimeType === "application/json") {
            const text = buffer.toString("utf-8");
            console.log(`[TextExtractor] Plain text: ${text.length} chars`);
            return { text };
        }

        if (mimeType === "application/pdf") {
            const text = await extractPdfText(buffer);
            console.log(`[TextExtractor] PDF extracted: ${text.length} chars`);
            return { text };
        }

        if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const text = await extractDocxText(buffer);
            console.log(`[TextExtractor] DOCX extracted: ${text.length} chars`);
            return { text };
        }

        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
}

export const DefaultTextExtractor = TextExtractor.createImplementation({
    implementation: TextExtractorImpl,
    dependencies: []
});

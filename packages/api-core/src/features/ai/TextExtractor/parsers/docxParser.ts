import { inflateRawSync } from "node:zlib";

export async function extractDocxText(buffer: Buffer): Promise<string> {
    const xml = extractFileFromZip(buffer, "word/document.xml");
    if (!xml) {
        throw new Error("Invalid DOCX: word/document.xml not found.");
    }
    return extractTextFromWordXml(xml);
}

function extractTextFromWordXml(xml: string): string {
    const paragraphs: string[] = [];
    const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paragraphMatch: RegExpExecArray | null;

    while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
        const paragraphXml = paragraphMatch[0];
        const texts: string[] = [];
        const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
        let textMatch: RegExpExecArray | null;

        while ((textMatch = textRegex.exec(paragraphXml)) !== null) {
            texts.push(textMatch[1]);
        }

        if (texts.length > 0) {
            paragraphs.push(texts.join(""));
        }
    }

    return paragraphs.join("\n");
}

// Minimal ZIP Central Directory parser — extracts a single file by name.
function extractFileFromZip(buffer: Buffer, targetPath: string): string | null {
    const eocdOffset = findEocd(buffer);
    if (eocdOffset === -1) {
        throw new Error("Invalid ZIP: End of Central Directory not found.");
    }

    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
    const cdSize = buffer.readUInt32LE(eocdOffset + 12);
    const cdEnd = cdOffset + cdSize;
    let offset = cdOffset;

    while (offset < cdEnd) {
        const sig = buffer.readUInt32LE(offset);
        if (sig !== 0x02014b50) {
            break;
        }

        const compressionMethod = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const fileNameLen = buffer.readUInt16LE(offset + 28);
        const extraLen = buffer.readUInt16LE(offset + 30);
        const commentLen = buffer.readUInt16LE(offset + 32);
        const localHeaderOffset = buffer.readUInt32LE(offset + 42);
        const fileName = buffer.toString("utf-8", offset + 46, offset + 46 + fileNameLen);

        if (fileName === targetPath) {
            return readLocalFile(buffer, localHeaderOffset, compressionMethod, compressedSize);
        }

        offset += 46 + fileNameLen + extraLen + commentLen;
    }

    return null;
}

function readLocalFile(
    buffer: Buffer,
    offset: number,
    compressionMethod: number,
    compressedSize: number
): string {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) {
        throw new Error("Invalid ZIP: bad local file header.");
    }

    const localFileNameLen = buffer.readUInt16LE(offset + 26);
    const localExtraLen = buffer.readUInt16LE(offset + 28);
    const dataOffset = offset + 30 + localFileNameLen + localExtraLen;

    const raw = buffer.subarray(dataOffset, dataOffset + compressedSize);

    if (compressionMethod === 0) {
        return raw.toString("utf-8");
    }

    if (compressionMethod === 8) {
        return inflateRawSync(raw).toString("utf-8");
    }

    throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
}

function findEocd(buffer: Buffer): number {
    // EOCD signature: 0x06054b50
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
        if (buffer.readUInt32LE(i) === 0x06054b50) {
            return i;
        }
    }
    return -1;
}

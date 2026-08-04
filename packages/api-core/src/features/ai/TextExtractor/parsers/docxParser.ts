import { inflateRawSync } from "node:zlib";

export async function extractDocxText(buffer: Buffer): Promise<string> {
    const xml = extractFileFromZip(buffer, "word/document.xml");
    if (!xml) {
        throw new Error("Invalid DOCX: word/document.xml not found.");
    }

    const stylesXml = extractFileFromZip(buffer, "word/styles.xml");
    const styleMap = stylesXml ? buildStyleMap(stylesXml) : new Map<string, string>();

    return convertToMarkdown(xml, styleMap);
}

function buildStyleMap(stylesXml: string): Map<string, string> {
    const map = new Map<string, string>();
    const styleRegex = /<w:style\s[^>]*w:styleId="([^"]*)"[^>]*>[\s\S]*?<\/w:style>/g;
    let match: RegExpExecArray | null;

    while ((match = styleRegex.exec(stylesXml)) !== null) {
        const styleId = match[1];
        const block = match[0];
        const nameMatch = block.match(/<w:name\s+w:val="([^"]*)"/);
        if (nameMatch) {
            map.set(styleId, nameMatch[1]);
        }
    }

    return map;
}

function getHeadingLevel(paragraphXml: string, styleMap: Map<string, string>): number {
    const styleMatch = paragraphXml.match(/<w:pStyle\s+w:val="([^"]*)"/);
    if (!styleMatch) {
        return 0;
    }

    const styleId = styleMatch[1];

    const directMatch = styleId.match(/^[Hh]eading(\d)$/);
    if (directMatch) {
        return parseInt(directMatch[1], 10);
    }

    const styleName = styleMap.get(styleId) ?? "";
    const nameMatch = styleName.match(/^[Hh]eading\s*(\d)$/);
    if (nameMatch) {
        return parseInt(nameMatch[1], 10);
    }

    if (/title/i.test(styleName) || /title/i.test(styleId)) {
        return 1;
    }

    return 0;
}

function isListItem(paragraphXml: string): boolean {
    return /<w:numId\s/.test(paragraphXml);
}

function extractRunMarkdown(runXml: string): string {
    const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    const texts: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = textRegex.exec(runXml)) !== null) {
        texts.push(match[1]);
    }
    if (texts.length === 0) {
        return "";
    }

    const text = texts.join("");
    const isBold = /<w:b[\s/>]/.test(runXml) && !/<w:b\s+w:val="(false|0)"/.test(runXml);
    const isItalic = /<w:i[\s/>]/.test(runXml) && !/<w:i\s+w:val="(false|0)"/.test(runXml);

    if (isBold && isItalic) {
        return `***${text}***`;
    }
    if (isBold) {
        return `**${text}**`;
    }
    if (isItalic) {
        return `*${text}*`;
    }
    return text;
}

function convertToMarkdown(xml: string, styleMap: Map<string, string>): string {
    const paragraphs: string[] = [];
    const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
    let paragraphMatch: RegExpExecArray | null;

    while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
        const paragraphXml = paragraphMatch[0];

        const runRegex = /<w:r[\s>][\s\S]*?<\/w:r>/g;
        const runs: string[] = [];
        let runMatch: RegExpExecArray | null;
        while ((runMatch = runRegex.exec(paragraphXml)) !== null) {
            const md = extractRunMarkdown(runMatch[0]);
            if (md) {
                runs.push(md);
            }
        }

        if (runs.length === 0) {
            continue;
        }

        let line = runs.join("");
        const headingLevel = getHeadingLevel(paragraphXml, styleMap);

        if (headingLevel > 0 && headingLevel <= 6) {
            line = `${"#".repeat(headingLevel)} ${line}`;
        } else if (isListItem(paragraphXml)) {
            line = `- ${line}`;
        }

        paragraphs.push(line);
    }

    return paragraphs.join("\n\n");
}

// --- ZIP utilities (unchanged) ---

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
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
        if (buffer.readUInt32LE(i) === 0x06054b50) {
            return i;
        }
    }
    return -1;
}

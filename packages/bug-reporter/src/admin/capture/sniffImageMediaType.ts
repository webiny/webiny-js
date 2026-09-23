/*
 * The magic numbers of the four types a screenshot is allowed to be, matching
 * `api/screenshotMediaTypes.ts`. Used when the browser hands over a file with no type of its own,
 * and to check the type it does hand over, because that type comes from the page and a data URL
 * built from it is what the API stores and GitHub renders.
 */
const SIGNATURES: { mediaType: string; bytes: number[]; offset: number }[] = [
    { mediaType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
    { mediaType: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
    { mediaType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 },
    /* "WEBP", at byte 8 of a RIFF container. */
    { mediaType: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }
];

const HEADER_LENGTH = 12;

function matches(header: Uint8Array, signature: (typeof SIGNATURES)[number]): boolean {
    for (let index = 0; index < signature.bytes.length; index++) {
        if (header[signature.offset + index] !== signature.bytes[index]) {
            return false;
        }
    }
    return true;
}

/* Returns null for anything that is not one of the four, which is the signal to drop it. */
export async function sniffImageMediaType(file: File): Promise<string | null> {
    const slice = file.slice(0, HEADER_LENGTH);
    const buffer = await slice.arrayBuffer();
    const header = new Uint8Array(buffer);

    for (const signature of SIGNATURES) {
        if (matches(header, signature)) {
            return signature.mediaType;
        }
    }

    return null;
}

import { sniffImageMediaType } from "./sniffImageMediaType.js";

function readAsBase64(file: File): Promise<string | null> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                resolve(null);
                return;
            }
            const separator = result.indexOf(",");
            if (separator === -1) {
                resolve(null);
                return;
            }
            resolve(result.slice(separator + 1));
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

/*
 * `File.type` is empty whenever the browser could not work the type out, which happens to images
 * dragged in from disk with no extension. Dropping those silently meant the paste looked like it
 * did nothing, so a file with no type is kept and identified from its first bytes instead.
 */
function findImage(data: DataTransfer): File | null {
    // Covers both a raw screenshot on the clipboard and an image file copied from Finder.
    for (const file of data.files) {
        if (file.type === "" || file.type.startsWith("image/")) {
            return file;
        }
    }

    for (const item of data.items) {
        if (item.kind !== "file") {
            continue;
        }
        if (item.type !== "" && !item.type.startsWith("image/")) {
            continue;
        }
        const file = item.getAsFile();
        if (file) {
            return file;
        }
    }

    return null;
}

/*
 * Pulls an image off a paste event as a data URL. Returns null when the clipboard holds no
 * image, which is the signal to leave the paste alone so text still lands in the textarea.
 *
 * The media type comes from the bytes, not from what the browser said it was. It ends up in the
 * data URL the API stores and GitHub renders by extension, so a wrong one shows a broken image.
 */
export async function readPastedImage(event: ClipboardEvent): Promise<string | null> {
    const data = event.clipboardData;
    if (!data) {
        return null;
    }

    const image = findImage(data);
    if (!image) {
        return null;
    }

    const mediaType = await sniffImageMediaType(image);
    if (!mediaType) {
        return null;
    }

    const base64 = await readAsBase64(image);
    if (!base64) {
        return null;
    }

    return `data:${mediaType};base64,${base64}`;
}

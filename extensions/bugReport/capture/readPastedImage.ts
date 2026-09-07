function readAsDataUrl(file: File): Promise<string | null> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                resolve(result);
                return;
            }
            resolve(null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function findImage(data: DataTransfer): File | null {
    // Covers both a raw screenshot on the clipboard and an image file copied from Finder.
    for (const file of data.files) {
        if (file.type.startsWith("image/")) {
            return file;
        }
    }

    for (const item of data.items) {
        if (item.kind !== "file" || !item.type.startsWith("image/")) {
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

    return readAsDataUrl(image);
}

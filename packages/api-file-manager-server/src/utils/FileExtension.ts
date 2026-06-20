import { mimeTypes } from "~/utils/mimeTypes.js";
import type { PresignedPostPayloadData } from "~/types.js";

export class FileExtension {
    private data: PresignedPostPayloadData;

    constructor(data: PresignedPostPayloadData) {
        this.data = data;
    }

    getValue() {
        const name = (this.data.key || this.data.name).toLowerCase();

        const maybeExt = name.split(".").pop() as string;
        const extensions = mimeTypes[this.data.type];
        if (extensions && !extensions.includes(maybeExt)) {
            return extensions[0];
        }

        return "";
    }
}

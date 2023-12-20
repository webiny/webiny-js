import sanitizeFilename from "sanitize-filename";
import { PresignedPostPayloadData } from "~/types";
import { FileExtension } from "~/utils/FileExtension";

export class FileKey {
    private data: PresignedPostPayloadData;
    private extension: FileExtension;
    private key: string;

    constructor(data: PresignedPostPayloadData) {
        this.data = data;
        this.extension = new FileExtension(data);
        this.key = this.getSanitizedKey();
    }

    getExtension() {
        return this.extension.getValue();
    }

    setKey(key: string) {
        this.key = key;
        return this;
    }

    toString() {
        return [this.data.keyPrefix, this.data.id, this.key].filter(Boolean).join("/");
    }

    private getSanitizedKey() {
        const key = sanitizeFilename(this.data.key || this.data.name).replace(/\s/g, "");

        return [key, this.getExtension()].filter(Boolean).join(".");
    }
}

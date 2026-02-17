import type { PresignedPostPayloadData } from "~/types.js";
import { FileExtension } from "~/utils/FileExtension.js";

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
        return ["original", this.getExtension()].filter(Boolean).join(".");
    }
}

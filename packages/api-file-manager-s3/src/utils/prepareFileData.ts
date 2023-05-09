// @ts-ignore `mdbid` has no type declarations
import mdbid from "mdbid";
import sanitizeFilename from "sanitize-filename";
import { PresignedPostPayloadData, FileData } from "~/types";
import { mimeTypes } from "./mimeTypes";

class FileKey {
    private readonly name: string;
    private readonly type: string;
    private prefix: string | undefined;
    private id: string | undefined;
    private extension = "";

    constructor(name: string, type: string) {
        this.type = type;
        this.name = name;
    }

    setId(id: string) {
        if (!this.name.startsWith(`${id}/`)) {
            this.id = id;
        }
    }

    setPrefix(prefix: string) {
        this.prefix = prefix;
    }

    getKey() {
        const key = sanitizeFilename(this.name).replace(/\s/g, "");
        const maybeHasExtension = key.toLowerCase().includes(".");

        if (maybeHasExtension) {
            const maybeExt = key.toLowerCase().split(".").pop() as string;
            const extensions = mimeTypes[this.type];
            if (extensions && !extensions.includes(maybeExt)) {
                this.extension = extensions[0];
            }
        }

        const keyWithExt = [key, this.extension].filter(Boolean).join(".");
        return [this.prefix, this.id, keyWithExt].filter(Boolean).join("/");
    }
}

export const prepareFileData = (data: PresignedPostPayloadData): FileData => {
    // If type is missing, let's use the default "application/octet-stream" type,
    // which is also the default type that the Amazon S3 would use.
    const contentType = data.type || "application/octet-stream";

    const id = data.id || mdbid();
    const key = new FileKey(data.key || data.name, data.type);

    key.setId(id);

    if (data.keyPrefix) {
        key.setPrefix(data.keyPrefix);
    }

    return {
        id,
        name: data.name,
        key: key.getKey(),
        type: contentType,
        size: data.size
    };
};

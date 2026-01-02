import type { File } from "@webiny/api-file-manager/domain/file/types.js";

export class CdnPathsGenerator {
    generate(file: File) {
        return [`/files/${file.key}*`, `/private/${file.key}*`];
    }
}

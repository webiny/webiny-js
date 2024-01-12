import { File } from "@webiny/api-file-manager/types";

export class CdnPathsGenerator {
    generate(file: File) {
        return [`/files/${file.key}*`, `/private/${file.key}*`, ...file.aliases];
    }
}

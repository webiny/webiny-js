import { S3 } from "@webiny/aws-sdk/client-s3";
import { FileEntry } from "./createFileEntity";

export class FileMetadata {
    private s3: S3;
    private fileEntry: FileEntry;
    private readonly bucket: string;
    private readonly metadataKey: string;

    constructor(s3: S3, bucket: string, fileEntry: FileEntry) {
        this.bucket = bucket;
        this.s3 = s3;
        this.fileEntry = fileEntry;

        const fileKey = ("/" + fileEntry.values["text@key"]) as string;
        this.metadataKey = `${fileKey}.metadata`;
    }

    async create() {
        const metadata = {
            id: this.fileEntry.id,
            tenant: this.fileEntry.tenant,
            locale: this.fileEntry.locale,
            size: this.fileEntry.values["number@size"],
            contentType: this.fileEntry.values["string@type"]
        };

        try {
            await this.s3.putObject({
                Bucket: this.bucket,
                Key: this.metadataKey,
                Body: JSON.stringify(metadata, null, 2)
            });
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
        }
    }

    async exists() {
        try {
            await this.s3.headObject({ Bucket: this.bucket, Key: this.metadataKey });
            return true;
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            return false;
        }
    }
}

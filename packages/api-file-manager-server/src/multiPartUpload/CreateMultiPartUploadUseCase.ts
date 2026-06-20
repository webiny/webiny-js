import path from "node:path";
import { mkdir } from "node:fs/promises";
import { mdbid } from "@webiny/utils";
import { createUploadToken } from "~/utils/uploadToken.js";
import type { FileData } from "~/types.js";

interface CreateMultiPartUploadParams {
    file: FileData;
    numberOfParts: number;
    tenantId: string;
    serverUrl: string;
}

interface MultiPartUploadFilePart {
    partNumber: number;
    url: string;
}

interface CreateMultiPartUploadResult {
    file: FileData;
    uploadId: string;
    parts: MultiPartUploadFilePart[];
}

export class CreateMultiPartUploadUseCase {
    private readonly storagePath: string;

    public constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    public async execute(
        params: CreateMultiPartUploadParams
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts, tenantId, serverUrl } = params;

        const uploadId = mdbid();

        const multipartDir = path.join(this.storagePath, "multipart", uploadId);
        await mkdir(multipartDir, { recursive: true });

        const secret = process.env.WEBINY_UPLOAD_SECRET as string;
        const expiresAt = Date.now() + 86_400_000; /* 24h */

        const parts = Array.from({ length: numberOfParts }, (_, index) => {
            const partNumber = index + 1;

            const token = createUploadToken(
                {
                    key: uploadId,
                    tenantId,
                    expiresAt,
                    uploadMinFileSize: 0,
                    uploadMaxFileSize: 0
                },
                secret
            );

            const url = `${serverUrl}/webiny-multipart-upload/${uploadId}/${partNumber}?token=${token}`;

            return {
                partNumber,
                url
            };
        });

        return {
            file,
            uploadId,
            parts
        };
    }
}

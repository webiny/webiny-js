import { Result } from "@webiny/feature/api";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { UploadRejectedError } from "~/domain/UploadRejectedError.js";
import { isTenantFileKey } from "~/utils/isTenantFileKey.js";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { UploadPartUseCase as Abstraction } from "./abstractions.js";

class UploadPartUseCaseImpl implements Abstraction.Interface {
    public constructor(
        private readonly config: FileManagerStandaloneConfig.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    public async execute(
        params: Abstraction.Params
    ): Promise<Result<Abstraction.Output, UploadRejectedError>> {
        const { uploadId, partNumber, token, body } = params;

        let payload;
        try {
            payload = verifyUploadToken(token, this.config.uploadSecret);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Invalid token.";
            return Result.fail(new UploadRejectedError(message));
        }

        // The token names one part of one upload; a whole-file token has no `multipart`.
        if (
            payload.multipart?.uploadId !== uploadId ||
            payload.multipart.partNumber !== partNumber
        ) {
            return Result.fail(new UploadRejectedError("Token key mismatch."));
        }

        if (!isTenantFileKey(payload.tenantId, payload.key)) {
            return Result.fail(new UploadRejectedError("Invalid path."));
        }

        const etag = await this.objectStorage.uploadPart({
            key: payload.key,
            uploadId,
            partNumber,
            body
        });
        return Result.ok({ etag });
    }
}

export const UploadPartUseCase = Abstraction.createImplementation({
    implementation: UploadPartUseCaseImpl,
    dependencies: [FileManagerStandaloneConfig, ObjectStorage]
});

import { Result } from "@webiny/feature/api";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { UploadRejectedError } from "~/domain/UploadRejectedError.js";
import { isTenantFileKey } from "~/utils/isTenantFileKey.js";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { UploadFileUseCase as Abstraction } from "./abstractions.js";

class UploadFileUseCaseImpl implements Abstraction.Interface {
    public constructor(
        private readonly config: FileManagerStandaloneConfig.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    public async execute(params: Abstraction.Params): Promise<Result<void, UploadRejectedError>> {
        const { key, token, contents } = params;

        let payload;
        try {
            payload = verifyUploadToken(token, this.config.uploadSecret);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Invalid token.";
            return Result.fail(new UploadRejectedError(message));
        }

        // A token for one part of a multipart upload doesn't upload a whole file.
        if (payload.key !== key || payload.multipart) {
            return Result.fail(new UploadRejectedError("Token key mismatch."));
        }

        const fileSize = contents.length;
        if (payload.uploadMaxFileSize > 0 && fileSize > payload.uploadMaxFileSize) {
            return Result.fail(new UploadRejectedError("File exceeds maximum allowed size."));
        }
        if (payload.uploadMinFileSize > 0 && fileSize < payload.uploadMinFileSize) {
            return Result.fail(new UploadRejectedError("File is below minimum allowed size."));
        }

        // The signed key must stay inside the files of the tenant the token was issued for.
        if (!isTenantFileKey(payload.tenantId, key)) {
            return Result.fail(new UploadRejectedError("Invalid path."));
        }

        await this.objectStorage.put(key, contents);
        return Result.ok();
    }
}

export const UploadFileUseCase = Abstraction.createImplementation({
    implementation: UploadFileUseCaseImpl,
    dependencies: [FileManagerStandaloneConfig, ObjectStorage]
});

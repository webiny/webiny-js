import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { getTenantFilesPrefix } from "~/utils/getTenantFilesPrefix.js";
import { isKeyInsidePrefix } from "~/utils/isKeyInsidePrefix.js";
import { toBuffer } from "../utils.js";

class UploadPartRouteImpl implements HttpRouteHandler.Interface {
    public constructor(
        private readonly config: FileManagerStandaloneConfig.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    public async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        const secret = this.config.uploadSecret;

        const query = request.query ?? {};
        const uploadId = query["uploadId"];
        const partNumberStr = query["partNumber"];
        const token = query["token"];

        if (!uploadId || !partNumberStr || !token) {
            return response.status(400).json({ error: "Missing uploadId, partNumber, or token." });
        }

        const partNumber = parseInt(partNumberStr, 10);
        if (isNaN(partNumber) || partNumber < 1) {
            return response.status(400).json({ error: "Invalid partNumber." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return response
                .status(400)
                .json({ error: err instanceof Error ? err.message : "Invalid token." });
        }

        if (
            payload.multipart?.uploadId !== uploadId ||
            payload.multipart.partNumber !== partNumber
        ) {
            return response.status(400).json({ error: "Token key mismatch." });
        }

        const filesPrefix = getTenantFilesPrefix(payload.tenantId);
        if (!isKeyInsidePrefix(payload.key, filesPrefix)) {
            return response.status(400).json({ error: "Invalid path." });
        }

        const body = toBuffer(request.body);
        const etag = await this.objectStorage.uploadPart({
            key: payload.key,
            uploadId,
            partNumber,
            body
        });

        return response.header("etag", etag);
    }
}

export const UploadPartRoute = HttpRouteHandler.createImplementation({
    implementation: UploadPartRouteImpl,
    dependencies: [FileManagerStandaloneConfig, ObjectStorage]
});

class UploadPartRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "upload-part";
    readonly method = "PUT";
    readonly path = "/webiny-file-upload/parts";
    readonly handler = UploadPartRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const UploadPartRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: UploadPartRouteDefinitionImpl,
    dependencies: []
});

import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/api-kernel-core";
import { UploadPartUseCase } from "~/features/UploadPart/abstractions.js";
import { toBuffer } from "../utils.js";

class UploadPartRouteImpl implements HttpRouteHandler.Interface {
    public constructor(private readonly uploadPart: UploadPartUseCase.Interface) {}

    public async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
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

        const body = toBuffer(request.body);
        const result = await this.uploadPart.execute({ uploadId, partNumber, token, body });
        if (result.isFail()) {
            return response.status(400).json({ error: result.error.message });
        }

        return response.header("etag", result.value.etag);
    }
}

export const UploadPartRoute = HttpRouteHandler.createImplementation({
    implementation: UploadPartRouteImpl,
    dependencies: [UploadPartUseCase]
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

import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { UploadFileUseCase } from "~/features/UploadFile/abstractions.js";
import { toBuffer } from "../utils.js";
import { parseMultipart } from "../utils.js";
import { getBoundary } from "../utils.js";

class UploadSingleFileRouteImpl implements HttpRouteHandler.Interface {
    public constructor(private readonly uploadFile: UploadFileUseCase.Interface) {}

    public async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
        const contentType =
            request.headers["content-type"] ?? request.headers["Content-Type"] ?? "";
        const boundary = getBoundary(contentType);
        if (!boundary) {
            return response
                .status(400)
                .json({ error: "Expected multipart/form-data with a boundary." });
        }

        const body = toBuffer(request.body);
        const { fields, files } = parseMultipart(body, boundary);
        const key = fields.find(field => field.name === "key")?.value;
        const token = fields.find(field => field.name === "token")?.value;
        const file = files[0];

        if (!key || !token) {
            return response.status(400).json({ error: "Missing key or token." });
        }

        if (!file) {
            return response.status(400).json({ error: "No file in request." });
        }

        const result = await this.uploadFile.execute({ key, token, contents: file.data });
        if (result.isFail()) {
            return response.status(400).json({ error: result.error.message });
        }

        return response.status(204);
    }
}

export const UploadSingleFileRoute = HttpRouteHandler.createImplementation({
    implementation: UploadSingleFileRouteImpl,
    dependencies: [UploadFileUseCase]
});

class UploadSingleFileRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "upload-single-file";
    readonly method = "POST";
    readonly path = "/webiny-file-upload";
    readonly handler = UploadSingleFileRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const UploadSingleFileRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: UploadSingleFileRouteDefinitionImpl,
    dependencies: []
});

import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="coral" />
  <text x="50" y="55" text-anchor="middle" font-size="14" fill="white">cloudi</text>
</svg>`;

class FilesHandlerImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = "/files/*";

    async handle(_request: IHttpRequest): Promise<IHttpResponse> {
        return {
            statusCode: 200,
            headers: { "Content-Type": "image/svg+xml" },
            body: SVG
        };
    }
}

export const filesHandler = HttpRoute.createImplementation({
    implementation: FilesHandlerImpl,
    dependencies: []
});

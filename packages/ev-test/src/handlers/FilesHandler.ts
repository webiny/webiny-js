import { CloudHandler } from "@cloudi/core";
import type { NextFunction } from "@cloudi/core";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="coral" />
  <text x="50" y="55" text-anchor="middle" font-size="14" fill="white">cloudi</text>
</svg>`;

class FilesHandlerImpl implements CloudHandler.Interface {
    private matches(event: any): boolean {
        return event?.method === "GET" && event?.path?.startsWith("/files");
    }

    async execute(event: any, next: NextFunction) {
        if (!this.matches(event)) {
            return next();
        }
        return {
            statusCode: 200,
            headers: { "Content-Type": "image/svg+xml" },
            body: SVG
        };
    }
}

export const filesHandler = CloudHandler.createImplementation({
    implementation: FilesHandlerImpl,
    dependencies: []
});

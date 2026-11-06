import { errorMessage } from "./errorMessage.js";

export class ManifestBuildError extends Error {
    constructor(componentName: string, cause: unknown) {
        const reason = errorMessage(cause);
        super(`Could not build the manifest for "${componentName}": ${reason}`);
        this.name = "ManifestBuildError";
    }
}

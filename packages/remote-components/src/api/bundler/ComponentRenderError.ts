import { errorMessage } from "./errorMessage.js";

export class ComponentRenderError extends Error {
    constructor(componentName: string, cause: unknown) {
        const reason = errorMessage(cause);
        super(`Could not render "${componentName}": ${reason}`);
        this.name = "ComponentRenderError";
    }
}

import { AbstractExtension } from "./AbstractExtension";

export class WorkspaceExtension extends AbstractExtension {
    async generate() {
        return Promise.resolve();
    }

    getNextSteps(): string[] {
        return [];
    }
}

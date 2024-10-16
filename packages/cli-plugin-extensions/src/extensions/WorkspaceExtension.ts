import { AbstractExtension } from "./AbstractExtension";

export class WorkspaceExtension extends AbstractExtension {
    async link() {
        return Promise.resolve();
    }

    getNextSteps(): string[] {
        return [];
    }
}

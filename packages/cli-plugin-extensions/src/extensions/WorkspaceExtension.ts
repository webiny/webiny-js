import { AbstractExtension } from "./AbstractExtension";
import { updateWorkspaces } from "~/utils";

export class WorkspaceExtension extends AbstractExtension {
    async link() {
        await updateWorkspaces(this.params.location);
    }

    getNextSteps(): string[] {
        return [];
    }
}

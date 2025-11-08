import type { ICanCreateFolderInRoot } from "./ICanCreateFolderInRoot.js";

export class CanCreateFolderInRoot implements ICanCreateFolderInRoot {
    execute() {
        return true;
    }
}

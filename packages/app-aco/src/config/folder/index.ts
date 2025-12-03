import type { ActionConfig } from "./Action.js";
import { Action } from "./Action.js";
import { DropConfirmation } from "./DropConfirmation.js";

export interface FolderConfig {
    actions: ActionConfig[];
    dropConfirmation: boolean;
}

export const Folder = {
    Action,
    DropConfirmation
};

import { Width } from "./Width.js";
import type { ActionConfig } from "./Action.js";
import { Action } from "./Action.js";
import { ActionButton } from "~/presentation/FileDetails/components/ActionButton.js";
import type { ThumbnailConfig } from "./Thumbnail.js";
import { Thumbnail } from "./Thumbnail.js";

export interface FileDetailsConfig {
    actions: ActionConfig[];
    thumbnails: ThumbnailConfig[];
    width: string;
}

export const FileDetails = {
    Action: Object.assign(Action, { Button: ActionButton }),
    Preview: {
        Thumbnail
    },
    Width
};

import type { ThumbnailConfig } from "./Thumbnail.js";
import type { ActionConfig } from "./Action.js";

export interface GridConfig {
    itemThumbnails: ThumbnailConfig[];
    itemActions: ActionConfig[];
}

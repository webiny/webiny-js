import type { PreviewTabConfig } from "./PreviewTab.js";
import { PreviewTab } from "./PreviewTab.js";

export interface DetailsConfig {
    tabs: PreviewTabConfig[];
}

export const Details = {
    Tab: PreviewTab
};

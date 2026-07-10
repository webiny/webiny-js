import type { PluginCollection } from "@webiny/plugins/types.js";
import { createElasticsearchBackgroundTasks } from "@webiny/api-elasticsearch-tasks";
import { createHeadlessCmsEsTasks } from "@webiny/api-headless-cms-es-tasks";

// NOTE: background-tasks itself is now registered DI-natively via BackgroundTasksFeature
// (wired in registerApiRequestStack for every flavour), so it is no longer bundled here. This
// factory only carries the OpenSearch-specific ES/CMS-ES task plugins (still legacy).
export const createBackgroundTasks = (): PluginCollection => {
    return [...createElasticsearchBackgroundTasks(), createHeadlessCmsEsTasks()];
};

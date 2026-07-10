import type { PluginCollection } from "@webiny/plugins/types.js";
import { createElasticsearchBackgroundTasks } from "@webiny/api-elasticsearch-tasks";

// NOTE: background-tasks + hcms-es-tasks are now registered DI-natively (BackgroundTasksFeature /
// HeadlessCmsEsTasksFeature), so they are no longer bundled here. This factory only carries the
// OpenSearch-specific Elasticsearch task plugins (still legacy).
export const createBackgroundTasks = (): PluginCollection => {
    return [...createElasticsearchBackgroundTasks()];
};

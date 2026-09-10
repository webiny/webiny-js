// Side-effect: pulls TaskController augmentation (response, state, logger, runtime, task)
import "@webiny/background-tasks/api/features/TaskController/index.js";

export { StorageScanner } from "./abstractions/StorageScanner.js";
export { IndexManager } from "./abstractions/IndexManager.js";
export { StorageWriter } from "./abstractions/StorageWriter.js";
export { IndexManagerFactory } from "./abstractions/IndexManagerFactory.js";
export { IndexSettingsManager } from "./abstractions/IndexSettingsManager.js";

export { DisableIndexing } from "./settings/abstractions/DisableIndexing.js";
export { EnableIndexing } from "./settings/abstractions/EnableIndexing.js";
export { DisableIndexing as DisableIndexingImpl } from "./settings/DisableIndexing.js";
export { EnableIndexing as EnableIndexingImpl } from "./settings/EnableIndexing.js";

export { EnableIndexingRunner } from "./tasks/enableIndexing/abstractions/EnableIndexingRunner.js";
export { EnableIndexingRunner as EnableIndexingRunnerImpl } from "./tasks/enableIndexing/EnableIndexingRunner.js";
export { EnableIndexingTask } from "./tasks/enableIndexing/EnableIndexingTask.js";

export { TenantIndexFactory } from "./abstractions/TenantIndexFactory.js";
export { CreateIndexesRunner } from "./tasks/createIndexes/abstractions/CreateIndexesRunner.js";
export { OnBeforeTrigger } from "./tasks/createIndexes/abstractions/OnBeforeTrigger.js";
export { CreateIndexesRunner as CreateIndexesRunnerImpl } from "./tasks/createIndexes/CreateIndexesRunner.js";
export { OnBeforeTrigger as OnBeforeTriggerImpl } from "./tasks/createIndexes/OnBeforeTrigger.js";
export { CreateIndexesTask } from "./tasks/createIndexes/CreateIndexesTask.js";

export { ReindexRunner } from "./tasks/reindex/abstractions/ReindexRunner.js";
export { ReindexRunner as ReindexRunnerImpl } from "./tasks/reindex/ReindexRunner.js";
export { ReindexTask } from "./tasks/reindex/ReindexTask.js";

export { SearchIndexTasksFeature } from "./feature.js";

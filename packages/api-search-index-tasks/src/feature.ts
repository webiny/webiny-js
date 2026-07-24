import { type Container, createFeature } from "@webiny/feature/api";
import { ReindexRunner } from "~/tasks/reindex/ReindexRunner.js";
import { ReindexTask } from "~/tasks/reindex/ReindexTask.js";
import { EnableIndexingRunner } from "~/tasks/enableIndexing/EnableIndexingRunner.js";
import { EnableIndexingTask } from "~/tasks/enableIndexing/EnableIndexingTask.js";
import { CreateIndexesRunner } from "~/tasks/createIndexes/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "~/tasks/createIndexes/OnBeforeTrigger.js";
import { CreateIndexesTask } from "~/tasks/createIndexes/CreateIndexesTask.js";

export const SearchIndexTasksFeature = createFeature({
	name: "SearchIndexTasks",
	register(container: Container) {
		container.register(ReindexRunner);
		container.register(ReindexTask);
		container.register(EnableIndexingRunner);
		container.register(EnableIndexingTask);
		container.register(CreateIndexesRunner);
		container.register(OnBeforeTrigger);
		container.register(CreateIndexesTask);
	}
});

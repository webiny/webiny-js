import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import {
    WorkflowStateChangedHandler,
    type WorkflowStateChangedEvent
} from "@webiny/app-workflows/domain/events.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { ICmsEntryWorkflowState } from "~/types.js";

function getModelIdFromAppName(app: string): string | null {
    const matched = app.match(/^cms\.([a-zA-Z0-9_-]+)$/);
    return matched ? matched[1] : null;
}

function toWorkflowStateValues(
    state: WorkflowStateChangedEvent["payload"]["state"]
): ICmsEntryWorkflowState | null {
    if (!state) {
        return null;
    }

    return {
        workflowId: state.id,
        stepId: state.currentStep.id,
        stepName: state.currentStep.title,
        state: state.state
    };
}

class WorkflowStateCacheHandlerImpl implements WorkflowStateChangedHandler.Interface {
    constructor(private cacheProvider: ContentEntriesCacheProvider.Interface) {}

    async handle(event: WorkflowStateChangedEvent): Promise<void> {
        const { app, targetRevisionId, state } = event.payload;

        const modelId = getModelIdFromAppName(app);
        if (!modelId) {
            return;
        }

        const { id: entryId } = parseIdentifier(targetRevisionId);
        const cache = this.cacheProvider.get(modelId);
        const workflowValues = toWorkflowStateValues(state);

        cache.updateItems((entry: CmsContentEntry) => {
            if (entry.entryId !== entryId) {
                return entry;
            }

            return {
                ...entry,
                meta: {
                    ...entry.meta,
                    system: {
                        workflow: workflowValues
                    }
                }
            };
        });
    }
}

export const WorkflowStateCacheHandler = WorkflowStateChangedHandler.createImplementation({
    implementation: WorkflowStateCacheHandlerImpl,
    dependencies: [ContentEntriesCacheProvider]
});

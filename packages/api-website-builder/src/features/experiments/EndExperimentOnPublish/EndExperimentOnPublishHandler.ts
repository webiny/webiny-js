import { PageAfterPublishEventHandler } from "~/features/pages/PublishPage/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { StopExperimentRepository } from "~/features/experiments/StopExperiment/abstractions.js";
import { ExperimentAfterStopEvent } from "~/features/experiments/StopExperiment/events.js";

/**
 * Structurally enforces the "publishing a new revision ends the active experiment" rule.
 * The experiment is pinned to a specific baseline revision; publishing a different revision of
 * the same page ends the running experiment. This is a system cascade, so it works directly
 * with repositories (which are permission-free) rather than the permission-gated use cases.
 */
class EndExperimentOnPublishHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private getEntry: GetEntryUseCase.Interface,
        private experimentModel: ExperimentModel.Interface,
        private stopExperimentRepository: StopExperimentRepository.Interface
    ) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        const page = event.payload.page;

        const result = await this.getEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            {
                where: {
                    latest: true,
                    values: {
                        pageEntryId: page.entryId,
                        status: "running"
                    }
                }
            }
        );

        if (result.isFail() || !result.value) {
            return;
        }

        const experiment = EntryToExperimentMapper.toExperiment(result.value);

        // Republishing the same baseline revision does not end the experiment.
        if (experiment.baselineRevisionId === page.id) {
            return;
        }

        const stopResult = await this.stopExperimentRepository.execute(experiment.id);
        if (stopResult.isFail()) {
            return;
        }

        await this.eventPublisher.publish(
            new ExperimentAfterStopEvent({
                experiment: stopResult.value,
                reason: "revisionPublished"
            })
        );
    }
}

export const EndExperimentOnPublishHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: EndExperimentOnPublishHandlerImpl,
    dependencies: [EventPublisher, GetEntryUseCase, ExperimentModel, StopExperimentRepository]
});

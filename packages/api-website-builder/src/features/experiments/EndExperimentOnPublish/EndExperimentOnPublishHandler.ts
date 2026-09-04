import { PageAfterPublishEventHandler } from "~/features/pages/PublishPage/abstractions.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { EntryToExperimentMapper } from "~/domain/experiment/EntryToExperimentMapper.js";
import { VariantModelProvider } from "~/domain/variant/abstractions.js";
import type { CmsEntryWbVariantValues } from "~/domain/variant/abstractions.js";
import { EntryToVariantMapper } from "~/domain/variant/EntryToVariantMapper.js";

/**
 * Governance: experiments and variants only serve once they are PUBLISHED, and the only place
 * a publish happens is here — as a cascade of the page publish, which is itself gated by the
 * approval workflow (ValidateWorkflowStateOnPageBeforePublish). So approving + publishing the
 * page is what takes its running experiment and ready variants live. Draft edits never serve.
 *
 * This is a system cascade authorised by the (already approved) page publish, so it works
 * directly with the CMS use cases rather than the permission-gated Website Builder use cases.
 */
class EndExperimentOnPublishHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(
        private getEntry: GetEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface,
        private experimentModel: ExperimentModel.Interface,
        private variantModelProvider: VariantModelProvider.Interface
    ) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        const variantModel = await this.variantModelProvider.get();
        const page = event.payload.page;

        // Find the page's running experiment (latest draft state) and publish it.
        const experimentResult = await this.getEntry.execute<CmsEntryWbExperimentValues>(
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

        if (experimentResult.isFail() || !experimentResult.value) {
            return;
        }

        const experiment = EntryToExperimentMapper.toExperiment(experimentResult.value);
        await this.publishEntry.execute(this.experimentModel, experiment.id);

        // Publish its ready variants so their content goes live alongside the experiment.
        const variantsResult = await this.listLatestEntries.execute<CmsEntryWbVariantValues>(
            variantModel,
            {
                where: {
                    values: {
                        experimentId: experiment.id,
                        status: "ready"
                    }
                },
                limit: 1000
            }
        );

        if (variantsResult.isFail()) {
            return;
        }

        for (const entry of variantsResult.value.entries) {
            const variant = EntryToVariantMapper.toVariant(entry);
            await this.publishEntry.execute(variantModel, variant.id);
        }
    }
}

export const EndExperimentOnPublishHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: EndExperimentOnPublishHandlerImpl,
    dependencies: [
        GetEntryUseCase,
        ListLatestEntriesUseCase,
        PublishEntryUseCase,
        ExperimentModel,
        VariantModelProvider
    ]
});

import { makeAutoObservable, computed, runInAction } from "mobx";
import { ExperimentsGateway } from "~/features/experiments/index.js";
import type {
    ExperimentDto,
    UpdateExperimentInput,
    VariantContentDto,
    VariantDto
} from "~/features/experiments/index.js";
import type { NewExperimentPayload } from "../ExperimentForm/abstractions/ExperimentFormPresenter.js";
import {
    ExperimentsEditorPresenter as Abstraction,
    type IExperimentsEditorPresenter,
    type IExperimentsEditorViewModel,
    type VariantOption
} from "./abstractions/ExperimentsEditorPresenter.js";
import { ExperimentsEditorDataSource } from "./abstractions/ExperimentsEditorDataSource.js";

class ExperimentsEditorPresenterImpl implements IExperimentsEditorPresenter {
    // Revision id of the page being edited (e.g. "<entryId>#0001"); the baseline for its experiments.
    private baselineRevisionId = "";
    private pageEntryId = "";
    private experiments: ExperimentDto[] = [];
    private selectedExperimentId: string | null = null;
    // Currently edited bucket: `null` = control, otherwise a variant entry id.
    private selectedVariantId: string | null = null;
    private variants: VariantDto[] = [];
    private paused = false;
    private drawerOpen = false;
    private editTarget: ExperimentDto | null = null;
    // Guards async variant/paused loads against out-of-order responses when the selection changes.
    private loadToken = 0;

    constructor(
        private readonly gateway: ExperimentsGateway.Interface,
        private readonly dataSource: ExperimentsEditorDataSource.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    private get selectedExperiment(): ExperimentDto | null {
        return (
            this.experiments.find(experiment => experiment.id === this.selectedExperimentId) ?? null
        );
    }

    private get selectedVariant(): VariantDto | null {
        return this.variants.find(variant => variant.entryId === this.selectedVariantId) ?? null;
    }

    private get variantOptions(): VariantOption[] {
        const split = this.selectedExperiment?.trafficSplit ?? { control: 0, variants: {} };
        return [
            { id: null, name: "Control", weight: split.control ?? 0, isControl: true },
            ...this.variants.map(variant => ({
                id: variant.entryId,
                name: variant.name,
                weight: split.variants?.[variant.entryId] ?? 0,
                isControl: false
            }))
        ];
    }

    get vm(): IExperimentsEditorViewModel {
        return {
            baselineRevisionId: this.baselineRevisionId,
            pageEntryId: this.pageEntryId,
            experiments: this.experiments,
            selectedExperimentId: this.selectedExperimentId,
            selectedExperiment: this.selectedExperiment,
            selectedVariantId: this.selectedVariantId,
            selectedVariant: this.selectedVariant,
            variantOptions: this.variantOptions,
            paused: this.paused,
            drawerOpen: this.drawerOpen,
            editTarget: this.editTarget
        };
    }

    init(pageRevisionId: string): void {
        this.baselineRevisionId = pageRevisionId;
        this.pageEntryId = pageRevisionId.split("#")[0];
        this.reload();
    }

    async reload(): Promise<void> {
        const list = await this.dataSource.listExperiments(this.pageEntryId);
        runInAction(() => {
            this.experiments = list;
            // Drop the selection if the experiment no longer exists.
            if (
                this.selectedExperimentId &&
                !list.some(experiment => experiment.id === this.selectedExperimentId)
            ) {
                this.selectedExperimentId = null;
            }
        });
    }

    selectExperiment(id: string | null): void {
        this.selectedExperimentId = id;
        // Reset the edited bucket to the control whenever the experiment changes.
        this.selectedVariantId = null;
        this.loadSelectedExperiment();
    }

    selectVariant(variantId: string | null): void {
        this.selectedVariantId = variantId;
    }

    /**
     * On the published (read-only) view, surface the running experiment and keep it selected so the
     * preview toolbar tracks it. Mirrors the old read-only auto-select effect.
     */
    syncReadOnlySelection(isReadOnly: boolean): void {
        if (!isReadOnly) {
            return;
        }
        const running =
            this.experiments.find(experiment => experiment.status === "running") ?? null;
        if (running && this.selectedExperimentId !== running.id) {
            this.selectExperiment(running.id);
        }
    }

    openManage(): void {
        this.editTarget = null;
        this.drawerOpen = true;
    }

    editExperiment(experiment: ExperimentDto): void {
        this.editTarget = experiment;
        this.drawerOpen = true;
    }

    closeDrawer(): void {
        this.drawerOpen = false;
    }

    /**
     * Load the variants and kill-switch state for the currently selected experiment. A load token
     * guards against a stale response overwriting a newer selection.
     */
    private loadSelectedExperiment(): void {
        const token = ++this.loadToken;
        const experimentId = this.selectedExperimentId;

        if (!experimentId) {
            this.variants = [];
            this.paused = false;
            return;
        }

        this.dataSource.listVariants(experimentId).then(list => {
            if (token === this.loadToken) {
                runInAction(() => {
                    this.variants = list;
                });
            }
        });

        // Load the kill-switch state only for a running experiment (keyed on its entryId).
        const experiment = this.experiments.find(item => item.id === experimentId) ?? null;
        if (experiment && experiment.status === "running") {
            this.dataSource.getExperimentPaused(experiment.entryId).then(value => {
                if (token === this.loadToken) {
                    runInAction(() => {
                        this.paused = value;
                    });
                }
            });
        } else {
            this.paused = false;
        }
    }

    async pause(): Promise<void> {
        const experiment = this.selectedExperiment;
        if (!experiment) {
            return;
        }
        await this.gateway.pauseExperiment(experiment.entryId);
        runInAction(() => {
            this.paused = true;
        });
    }

    async resume(): Promise<void> {
        const experiment = this.selectedExperiment;
        if (!experiment) {
            return;
        }
        await this.gateway.resumeExperiment(experiment.entryId);
        runInAction(() => {
            this.paused = false;
        });
    }

    /**
     * Activate an experiment. Only one experiment can run on a page at a time, so any other running
     * experiment (from the same page) is stopped first.
     */
    async activate(experimentId: string): Promise<ExperimentDto> {
        const active = this.experiments.find(
            experiment => experiment.status === "running" && experiment.id !== experimentId
        );
        if (active) {
            await this.gateway.stopExperiment(active.id);
        }
        return this.gateway.startExperiment(experimentId);
    }

    deactivate(experimentId: string): Promise<ExperimentDto> {
        return this.gateway.stopExperiment(experimentId);
    }

    /**
     * Persist a new experiment: create the experiment, then each variant (whose content the API
     * copies from the baseline) marked ready, then write the traffic split now that we have the
     * variant ids. The experiment key is carried in the analytics config.
     */
    async createExperiment(payload: NewExperimentPayload): Promise<ExperimentDto> {
        const experiment = await this.gateway.createExperiment({
            pageEntryId: this.pageEntryId,
            baselineRevisionId: this.baselineRevisionId,
            name: payload.name,
            targeting: { trafficPercentage: 100 },
            analytics: { provider: "posthog", experimentKey: payload.key },
            trafficSplit: { control: payload.control.weight, variants: {} }
        });

        const variantSplit: Record<string, number> = {};
        for (const variant of payload.variants) {
            const created = await this.gateway.createVariant({
                experimentId: experiment.id,
                name: variant.name
            });
            await this.gateway.updateVariant(created.id, { status: "ready" });
            variantSplit[created.entryId] = variant.weight;
        }

        return this.gateway.updateExperiment(experiment.id, {
            trafficSplit: { control: payload.control.weight, variants: variantSplit }
        });
    }

    updateExperiment(id: string, input: UpdateExperimentInput): Promise<ExperimentDto> {
        return this.gateway.updateExperiment(id, input);
    }

    /** Delete an experiment along with its variants. */
    async deleteExperiment(experimentId: string): Promise<boolean> {
        const variants = await this.gateway.listVariants(experimentId).catch(() => []);
        for (const variant of variants) {
            await this.gateway.deleteVariant(variant.id).catch(() => undefined);
        }
        return this.gateway.deleteExperiment(experimentId);
    }

    getVariant(id: string): Promise<VariantContentDto | null> {
        return this.gateway.getVariant(id);
    }

    saveVariant(revisionId: string, doc: Record<string, any>): Promise<VariantDto> {
        return this.gateway.updateVariant(revisionId, doc);
    }
}

export const ExperimentsEditorPresenter = Abstraction.createImplementation({
    implementation: ExperimentsEditorPresenterImpl,
    dependencies: [ExperimentsGateway, ExperimentsEditorDataSource]
});

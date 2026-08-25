import { makeAutoObservable, computed, reaction, runInAction, type IReactionDisposer } from "mobx";
import slugify from "slugify";
import { ExperimentsGateway } from "~/features/experiments/index.js";
import type { ExperimentDto, VariantDto } from "~/features/experiments/index.js";
import type {
    ExperimentFormInitial,
    NewExperimentPayload
} from "../ExperimentForm/abstractions/ExperimentFormPresenter.js";
import { bucketColor } from "../shared/variantColors.js";
import { ExperimentsEditorPresenter } from "../ExperimentsEditor/index.js";
import {
    ExperimentsManagerPresenter as Abstraction,
    type ExperimentCardViewModel,
    type ExperimentsManagerView,
    type IExperimentsManagerPresenter,
    type IExperimentsManagerViewModel
} from "./abstractions/ExperimentsManagerPresenter.js";

// Decorative "hero band" colours for the mini page previews (unrelated to bucket dot colours).
const BAND_COLORS = ["#4f46e5", "#0f9d58", "#c2410c", "#1f2937", "#0891b2"];

const toKey = (value: string): string => slugify(value, { lower: true, strict: true });

/**
 * Owns the manage drawer's view state (open/view/editTarget) and the per-experiment variant
 * summaries the cards render. All domain actions are delegated to the editor hub presenter, which
 * remains the single source of truth for the page's experiments and their lifecycle.
 */
class ExperimentsManagerPresenterImpl implements IExperimentsManagerPresenter {
    private view: ExperimentsManagerView = "list";
    private editInitial: ExperimentFormInitial | null = null;
    // Variants keyed by experiment id, loaded for the listed experiments so cards need no fetching.
    private variantsByExperiment: Record<string, VariantDto[]> = {};
    private disposers: IReactionDisposer[] = [];

    constructor(
        private readonly hub: ExperimentsEditorPresenter.Interface,
        // Read-only variant listing for card summaries and the edit form; all mutations go via the hub.
        private readonly gateway: ExperimentsGateway.Interface
    ) {
        makeAutoObservable<this, "hub" | "gateway">(this, {
            vm: computed,
            hub: false,
            gateway: false
        });
    }

    private get experiments(): ExperimentDto[] {
        return this.hub.vm.experiments;
    }

    private get cards(): ExperimentCardViewModel[] {
        return this.experiments.map(experiment => {
            const variants = this.variantsByExperiment[experiment.id] ?? [];
            const active = experiment.status === "running";
            const split = experiment.trafficSplit ?? { control: 0, variants: {} };

            const buckets = [
                {
                    key: "control",
                    name: "Control",
                    weight: split.control ?? 0,
                    dot: bucketColor(true, 0),
                    band: BAND_COLORS[0],
                    isControl: true
                },
                ...variants.map((variant, index) => ({
                    key: variant.entryId,
                    name: variant.name,
                    weight: split.variants?.[variant.entryId] ?? 0,
                    dot: bucketColor(false, index),
                    band: BAND_COLORS[(index + 1) % BAND_COLORS.length],
                    isControl: false
                }))
            ];

            return {
                experiment,
                active,
                buckets,
                variantCount: Object.keys(split.variants ?? {}).length
            };
        });
    }

    get vm(): IExperimentsManagerViewModel {
        return {
            open: this.hub.vm.drawerOpen,
            view: this.view,
            editTarget: this.hub.vm.editTarget,
            editInitial: this.editInitial,
            experiments: this.experiments,
            pageEntryId: this.hub.vm.pageEntryId,
            baselineRevisionId: this.hub.vm.baselineRevisionId,
            cards: this.cards
        };
    }

    init(): void {
        // Reset the drawer whenever it opens: jump straight to editing when asked, otherwise the
        // list. Mirrors the old drawer's open effect, now reading the hub's drawer state.
        this.disposers.push(
            reaction(
                () => ({ open: this.hub.vm.drawerOpen, editTarget: this.hub.vm.editTarget }),
                ({ open, editTarget }) => {
                    if (!open) {
                        return;
                    }
                    if (editTarget) {
                        this.startEdit(editTarget);
                    } else {
                        runInAction(() => {
                            this.view = "list";
                            this.editInitial = null;
                        });
                    }
                },
                { fireImmediately: true }
            )
        );

        // Load per-experiment variant summaries for the cards whenever the experiment set changes.
        this.disposers.push(
            reaction(
                () => this.experiments.map(experiment => experiment.id),
                () => this.loadCardVariants(),
                { fireImmediately: true }
            )
        );
    }

    dispose(): void {
        this.disposers.forEach(dispose => dispose());
        this.disposers = [];
    }

    /** Load the variants for every listed experiment so the cards render as pure observers. */
    private loadCardVariants(): void {
        for (const experiment of this.experiments) {
            this.gateway
                .listVariants(experiment.id)
                .then(list => {
                    runInAction(() => {
                        this.variantsByExperiment = {
                            ...this.variantsByExperiment,
                            [experiment.id]: list
                        };
                    });
                })
                .catch(() => {
                    runInAction(() => {
                        this.variantsByExperiment = {
                            ...this.variantsByExperiment,
                            [experiment.id]: []
                        };
                    });
                });
        }
    }

    showList(): void {
        this.view = "list";
        this.editInitial = null;
    }

    showCreate(): void {
        this.view = "create";
    }

    async startEdit(experiment: ExperimentDto): Promise<void> {
        const variants = await this.gateway.listVariants(experiment.id);
        const split = experiment.trafficSplit ?? { control: 100, variants: {} };
        const buckets = [
            {
                id: "control",
                isControl: true,
                name: "Control",
                key: "control",
                keyEdited: true,
                description: "",
                weight: split.control ?? 0
            },
            ...variants.map(variant => ({
                id: variant.entryId,
                isControl: false,
                name: variant.name,
                key: toKey(variant.name),
                keyEdited: true,
                description: "",
                weight: split.variants?.[variant.entryId] ?? 0,
                revisionId: variant.id
            }))
        ];
        runInAction(() => {
            this.editInitial = {
                name: experiment.name,
                key: (experiment.analytics?.experimentKey as string | undefined) ?? "",
                buckets
            };
            this.view = "edit";
        });
    }

    close(): void {
        this.hub.closeDrawer();
    }

    async createExperiment(payload: NewExperimentPayload): Promise<void> {
        await this.hub.createExperiment(payload);
        await this.hub.reload();
        runInAction(() => {
            this.view = "list";
        });
    }

    async updateExperiment(payload: NewExperimentPayload): Promise<void> {
        const editTarget = this.hub.vm.editTarget;
        if (!editTarget) {
            return;
        }
        const variantSplit: Record<string, number> = {};
        for (const variant of payload.variants) {
            variantSplit[variant.id] = variant.weight;
        }
        await this.hub.updateExperiment(editTarget.id, {
            name: payload.name,
            analytics: { provider: "posthog", experimentKey: payload.key },
            trafficSplit: { control: payload.control.weight, variants: variantSplit }
        });
        for (const variant of payload.variants) {
            if (variant.revisionId) {
                await this.hub.saveVariant(variant.revisionId, { name: variant.name });
            }
        }
        await this.hub.reload();
        runInAction(() => {
            this.view = "list";
        });
    }

    async activateExperiment(experiment: ExperimentDto): Promise<void> {
        await this.hub.activate(experiment.id);
        await this.hub.reload();
    }

    async deactivateExperiment(experiment: ExperimentDto): Promise<void> {
        await this.hub.deactivate(experiment.id);
        await this.hub.reload();
    }

    async deleteExperiment(experiment: ExperimentDto): Promise<void> {
        await this.hub.deleteExperiment(experiment.id);
        await this.hub.reload();
    }
}

export const ExperimentsManagerPresenter = Abstraction.createImplementation({
    implementation: ExperimentsManagerPresenterImpl,
    dependencies: [ExperimentsEditorPresenter, ExperimentsGateway]
});

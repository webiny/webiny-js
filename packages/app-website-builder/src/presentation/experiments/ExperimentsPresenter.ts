import { makeAutoObservable, runInAction } from "mobx";
import {
    ExperimentsPresenter as PresenterAbstraction,
    type ExperimentVm,
    type ExperimentsViewModel
} from "./abstractions.js";
import { ExperimentsGateway } from "~/features/experiments/abstractions.js";
import type { ExperimentDto, VariantDto } from "~/features/experiments/types.js";

class ExperimentsPresenterImpl implements PresenterAbstraction.Interface {
    vm: ExperimentsViewModel = {
        loading: false,
        busy: false,
        error: null,
        pageEntryId: "",
        baselineRevisionId: "",
        pageIsPublished: false,
        experiments: [],
        hasRunningExperiment: false
    };

    constructor(private gateway: ExperimentsGateway.Interface) {
        makeAutoObservable(this);
    }

    async init(params: {
        pageEntryId: string;
        baselineRevisionId: string;
        pageIsPublished: boolean;
    }) {
        runInAction(() => {
            this.vm.pageEntryId = params.pageEntryId;
            this.vm.baselineRevisionId = params.baselineRevisionId;
            this.vm.pageIsPublished = params.pageIsPublished;
            this.vm.error = null;
        });
        await this.reload();
    }

    private async reload() {
        runInAction(() => {
            this.vm.loading = true;
        });
        try {
            const experiments = await this.gateway.listExperiments(this.vm.pageEntryId);
            const withVariants = await Promise.all(
                experiments.map(async experiment => {
                    const variants = await this.gateway.listVariants(experiment.entryId);
                    return this.toExperimentVm(experiment, variants);
                })
            );
            runInAction(() => {
                this.vm.experiments = withVariants;
                this.vm.hasRunningExperiment = withVariants.some(e => e.status === "running");
                this.vm.loading = false;
            });
        } catch (error) {
            this.fail(error, "Could not load experiments.");
            runInAction(() => {
                this.vm.loading = false;
            });
        }
    }

    private toExperimentVm(experiment: ExperimentDto, variants: VariantDto[]): ExperimentVm {
        const split = experiment.trafficSplit ?? { control: 100, variants: {} };
        return {
            id: experiment.id,
            entryId: experiment.entryId,
            name: experiment.name,
            status: experiment.status,
            startedOn: experiment.startedOn,
            stoppedOn: experiment.stoppedOn,
            winningVariantId: experiment.winningVariantId,
            trafficSplit: {
                control: typeof split.control === "number" ? split.control : 100,
                variants: split.variants ?? {}
            },
            variants: variants.map(variant => ({
                id: variant.id,
                entryId: variant.entryId,
                name: variant.name,
                status: variant.status
            }))
        };
    }

    async createExperiment(name: string) {
        await this.run(async () => {
            await this.gateway.createExperiment({
                pageEntryId: this.vm.pageEntryId,
                baselineRevisionId: this.vm.baselineRevisionId,
                name,
                trafficSplit: { control: 100, variants: {} },
                targeting: { trafficPercentage: 100 },
                analytics: { provider: "posthog" }
            });
        });
    }

    async addVariant(experimentEntryId: string, name: string) {
        await this.run(async () => {
            const variant = await this.gateway.createVariant({
                experimentId: experimentEntryId,
                name
            });
            // Mark the variant ready so it participates in bucketing.
            await this.gateway.updateVariant(variant.id, { status: "ready" });
            await this.rebalance(experimentEntryId);
        });
    }

    async deleteVariant(experimentEntryId: string, variantId: string) {
        await this.run(async () => {
            await this.gateway.deleteVariant(variantId);
            await this.rebalance(experimentEntryId);
        });
    }

    async startExperiment(experimentEntryId: string) {
        await this.run(async () => {
            await this.gateway.startExperiment(experimentEntryId);
        });
    }

    async stopExperiment(experimentEntryId: string) {
        await this.run(async () => {
            await this.gateway.stopExperiment(experimentEntryId);
        });
    }

    async graduateVariant(experimentEntryId: string, variantId: string) {
        await this.run(async () => {
            await this.gateway.graduateVariant(experimentEntryId, variantId);
        });
    }

    /**
     * Even out the traffic split across the control and all ready variants, then persist it.
     * A finer-grained split editor can replace this later without touching the API.
     */
    private async rebalance(experimentEntryId: string) {
        const variants = await this.gateway.listVariants(experimentEntryId);
        const readyVariants = variants.filter(variant => variant.status === "ready");
        const buckets = readyVariants.length + 1;
        const share = Math.floor(100 / buckets);
        const variantSplit: Record<string, number> = {};
        for (const variant of readyVariants) {
            variantSplit[variant.entryId] = share;
        }
        const control = 100 - share * readyVariants.length;
        await this.gateway.updateExperiment(experimentEntryId, {
            trafficSplit: { control, variants: variantSplit }
        });
    }

    private async run(action: () => Promise<void>) {
        runInAction(() => {
            this.vm.busy = true;
            this.vm.error = null;
        });
        try {
            await action();
            await this.reload();
        } catch (error) {
            this.fail(error, "The operation could not be completed.");
        } finally {
            runInAction(() => {
                this.vm.busy = false;
            });
        }
    }

    private fail(error: unknown, fallback: string) {
        runInAction(() => {
            this.vm.error = error instanceof Error ? error.message : fallback;
        });
    }
}

export const ExperimentsPresenter = PresenterAbstraction.createImplementation({
    implementation: ExperimentsPresenterImpl,
    dependencies: [ExperimentsGateway]
});

import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import type { Stage } from "~/constants.js";
import { runReattachmentsKey } from "~/constants.js";
import { OverrideRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import type { ExtractionError } from "~/domain/errors.js";
import type { Reattachment } from "~/domain/types.js";
import type { ClassifyArtifact, ClusterArtifact, PlanArtifact } from "~/domain/artifacts.js";
import {
    type ApplyResult,
    applyClassifyOverrides,
    applyClusterOverrides,
    applyPlanOverrides,
    overrideMode,
    overridesForStage
} from "~/domain/overrides.js";

/**
 * Applies a job's overrides to a stage's machine output, after the handler runs and before any downstream
 * stage reads it (W8.1). The stage keeps its machine artifact and gains an effective one: downstream
 * reads the effective (the primary ref), the UI can inspect both. Reattachment outcomes are recorded per
 * run so the panel (W8.7) can show what applied and what could not.
 *
 * Only artifact overrides are applied here; a parameter override (the cluster threshold) changes what the
 * stage runs with and takes effect by re-running it, not by editing its output.
 */

export interface ApplyOverridesParams {
    stage: Stage;
    jobId: string;
    runId: string;
    /** The handler's produced artifact refs (name -> key). */
    artifacts: Record<string, string>;
    /** Builds a deterministic key for this stage/version, for the effective artifact. */
    artifactKey: (name: string) => string;
}

export interface ApplyOverridesResult {
    /** The artifact refs to record on the ledger — with the effective at the primary ref plus a
     * `<name>.machine` sibling when an override changed the output. */
    artifacts: Record<string, string>;
    reattachments: Reattachment[];
}

export interface IOverrideApplicator {
    apply(params: ApplyOverridesParams): Promise<Result<ApplyOverridesResult, ExtractionError>>;
}

export const OverrideApplicator = createAbstraction<IOverrideApplicator>(
    "ComponentExtraction/OverrideApplicator"
);
export namespace OverrideApplicator {
    export type Interface = IOverrideApplicator;
}

/** Per-stage config: which artifact name the overrides transform, and the pure applier for its shape. */
interface StageApplier {
    name: string;
    apply: (artifact: unknown, overrides: never) => ApplyResult<unknown>;
}

const STAGE_APPLIERS: Partial<Record<Stage, StageApplier>> = {
    cluster: {
        name: "clusters",
        apply: (artifact, overrides) =>
            applyClusterOverrides(artifact as ClusterArtifact, overrides)
    },
    classify: {
        name: "classifications",
        apply: (artifact, overrides) =>
            applyClassifyOverrides(artifact as ClassifyArtifact, overrides)
    },
    plan: {
        name: "plan",
        apply: (artifact, overrides) => applyPlanOverrides(artifact as PlanArtifact, overrides)
    }
};

/** The artifact name whose overrides a stage transforms, or undefined for a stage without an applier. */
export const stageArtifactName = (stage: Stage): string | undefined => STAGE_APPLIERS[stage]?.name;

class OverrideApplicatorImpl implements IOverrideApplicator {
    constructor(
        private overrides: OverrideRepository.Interface,
        private store: StageArtifactStore.Interface
    ) {}

    async apply(
        params: ApplyOverridesParams
    ): Promise<Result<ApplyOverridesResult, ExtractionError>> {
        const unchanged: ApplyOverridesResult = { artifacts: params.artifacts, reattachments: [] };

        const applier = STAGE_APPLIERS[params.stage];
        if (!applier) {
            return Result.ok(unchanged);
        }

        // Always apply against the MACHINE ref, never a previously-computed effective — so re-applying
        // after a correction is set or cleared is idempotent, not a double-apply.
        const machineKey =
            params.artifacts[`${applier.name}.machine`] ?? params.artifacts[applier.name];

        const stored = await this.overrides.listByJob(params.jobId);
        const overrides = stored.isOk()
            ? overridesForStage(stored.value, params.stage).filter(
                  override => overrideMode(override.correction.kind) === "artifact"
              )
            : [];
        if (overrides.length === 0) {
            // No overrides (or all cleared): revert the primary ref to the machine artifact and clear this
            // stage's reattachments.
            await this.recordReattachments(params.runId, params.stage, []);
            if (params.artifacts[`${applier.name}.machine`]) {
                const reverted = { ...params.artifacts, [applier.name]: machineKey };
                delete reverted[`${applier.name}.machine`];
                return Result.ok({ artifacts: reverted, reattachments: [] });
            }
            return Result.ok(unchanged);
        }

        if (!machineKey) {
            return Result.ok(unchanged);
        }
        const machine = await this.store.getJson<unknown>(machineKey);
        if (machine.isFail() || machine.value === null) {
            // Nothing to apply against — leave the machine output as the effective one.
            return Result.ok(unchanged);
        }

        const { effective, reattachments } = applier.apply(machine.value, overrides as never);

        // Persist the effective artifact at a sibling key; downstream reads it via the primary ref.
        const effectiveKey = params.artifactKey(`${applier.name}.effective`);
        const written = await this.store.putJson(effectiveKey, effective);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await this.recordReattachments(params.runId, params.stage, reattachments);

        return Result.ok({
            artifacts: {
                ...params.artifacts,
                [applier.name]: effectiveKey,
                [`${applier.name}.machine`]: machineKey
            },
            reattachments
        });
    }

    /** Replace this stage's reattachment outcomes in the run's list (stages run sequentially — no race). */
    private async recordReattachments(
        runId: string,
        stage: Stage,
        reattachments: Reattachment[]
    ): Promise<void> {
        const key = runReattachmentsKey(runId);
        const existing = await this.store.getJson<Reattachment[]>(key);
        const kept =
            existing.isOk() && Array.isArray(existing.value)
                ? existing.value.filter((entry: Reattachment) => entry.stage !== stage)
                : [];
        await this.store.putJson(key, [...kept, ...reattachments]);
    }
}

export const OverrideApplicatorService = createImplementation({
    abstraction: OverrideApplicator,
    implementation: OverrideApplicatorImpl,
    dependencies: [OverrideRepository, StageArtifactStore]
});

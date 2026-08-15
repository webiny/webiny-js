import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { REGENERATE_PLAN_TASK_ID, stageArtifactKey, stagesAfter } from "~/constants.js";
import { RunRepository, JobRepository, OverrideRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry, markStaleFrom } from "~/domain/ledger.js";
import type { ClassifyArtifact, PlanArtifact } from "~/domain/artifacts.js";
import { ComponentExtractionAi } from "~/features/shared/ai.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { OverrideApplicator } from "~/features/shared/OverrideApplicator.js";
import { PLAN_SYSTEM, buildPlanPrompt, parsePlanContract } from "./planContract.js";

export interface RegeneratePlanTaskInput {
    runId: string;
    signature: string;
    /** Optional operator guidance to steer the new contract; a plain re-roll when absent. */
    instruction?: string;
}

type RunParams = TaskDefinition.RunParams<RegeneratePlanTaskInput>;
type RunResult = Promise<TaskDefinition.Result<RegeneratePlanTaskInput>>;

/**
 * Regenerate one component's Plan contract (W8) — a fresh model call for that single cluster that proposes
 * new props and token bindings, replacing them in the Plan MACHINE artifact. Prop edits (plan.prop
 * overrides) for that component are cleared, since they were made against the old props; the operator
 * edits the fresh contract from there. The plan stage is then re-applied and everything downstream
 * (Generate, Assemble, Promote) marked stale, exactly as any other Plan correction does.
 */
class RegeneratePlanTaskImpl implements TaskDefinition.Interface<RegeneratePlanTaskInput> {
    readonly id = REGENERATE_PLAN_TASK_ID;
    readonly title = "Component extraction — regenerate plan";
    readonly description = "Re-proposes a single component's props and token bindings.";
    readonly maxIterations = 1;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    constructor(
        readonly runRepository: RunRepository.Interface,
        readonly jobRepository: JobRepository.Interface,
        readonly artifactStore: StageArtifactStore.Interface,
        readonly ai: ComponentExtractionAi.Interface,
        readonly manifestResolver: ThemeManifestResolver.Interface,
        readonly overrides: OverrideRepository.Interface,
        readonly applicator: OverrideApplicator.Interface
    ) {}

    async run({ input, controller }: RunParams): RunResult {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const log = controller.logger;

        const runResult = await this.runRepository.get(input.runId);
        if (runResult.isFail()) {
            return controller.response.error(runResult.error.message);
        }
        const run = runResult.value;

        const jobResult = await this.jobRepository.get(run.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;

        const plan = stageEntry(run.stages, "plan");
        if (!plan) {
            return controller.response.error("This run has no Plan stage to regenerate.");
        }
        // The machine artifact is what the handler produced; effective overrides layer on top of it. We
        // replace the component in the machine, then re-apply so effective is recomputed.
        const machineKey = plan.artifacts["plan.machine"] ?? plan.artifacts["plan"];
        if (!machineKey) {
            return controller.response.error("Plan has not produced a contract to regenerate.");
        }
        const planResult = await this.artifactStore.getJson<PlanArtifact>(machineKey);
        if (planResult.isFail() || !planResult.value) {
            return controller.response.error("The plan artifact could not be read.");
        }
        const planArtifact = planResult.value;
        const index = planArtifact.components.findIndex(
            component => component.signature === input.signature
        );
        if (index === -1) {
            return controller.response.error("The component to regenerate was not found.");
        }
        const component = planArtifact.components[index];

        // The cluster to re-plan comes from the EFFECTIVE classify artifact, so the fresh contract honours
        // any name/type correction the operator has made.
        const classifyKey = stageEntry(run.stages, "classify")?.artifacts.classifications;
        if (!classifyKey) {
            return controller.response.error("The classify artifact is missing.");
        }
        const classifyResult = await this.artifactStore.getJson<ClassifyArtifact>(classifyKey);
        if (classifyResult.isFail() || !classifyResult.value) {
            return controller.response.error("The classify artifact could not be read.");
        }
        const classified = classifyResult.value.clusters.find(
            entry => entry.cluster.signature === input.signature
        );
        if (!classified) {
            return controller.response.error("The classified cluster was not found.");
        }

        const manifest = await this.manifestResolver.resolve(job.themeEntryId, job.themeVersion);
        const manifestValue = manifest.isOk() ? manifest.value : null;

        const aiResult = await this.ai.generate({
            system: PLAN_SYSTEM,
            messages: [
                {
                    role: "user",
                    content: buildPlanPrompt(classified, manifestValue, input.instruction)
                }
            ]
        });
        if (aiResult.isFail()) {
            await log.error({ message: `Plan regenerate failed: ${aiResult.error.message}` });
            return controller.response.error(aiResult.error.message);
        }
        const contract = parsePlanContract(aiResult.value, classified.cluster.members.length);
        if (!contract || contract.props.length === 0) {
            await log.error({ message: "The model returned no usable contract." });
            return controller.response.error("The model returned no usable contract; try again.");
        }

        // Replace this component's props and token bindings in the machine artifact, keeping everything
        // else (name, type, representative, members, source texts) intact.
        const components = [...planArtifact.components];
        components[index] = {
            ...component,
            props: contract.props,
            tokenBindings: contract.tokenBindings
        };
        const written = await this.artifactStore.putJson(machineKey, {
            ...planArtifact,
            components
        });
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }

        // Clear the operator's prop edits for this component — they were made against the old props.
        const jobOverrides = await this.overrides.listByJob(run.jobId);
        if (jobOverrides.isOk()) {
            const stale = jobOverrides.value.filter(
                override =>
                    override.stage === "plan" && override.structuralSignature === input.signature
            );
            for (const override of stale) {
                await this.overrides.delete(override.id);
            }
        }

        // Re-apply the plan stage against the mutated machine, and cascade staleness downstream.
        const applied = await this.applicator.apply({
            stage: "plan",
            jobId: run.jobId,
            runId: run.id,
            artifacts: plan.artifacts,
            artifactKey: name => stageArtifactKey(run.id, "plan", plan.stageVersion, name)
        });
        let stages = run.stages;
        if (applied.isOk()) {
            stages = stages.map(current =>
                current.stage === "plan"
                    ? { ...current, artifacts: applied.value.artifacts }
                    : current
            );
        }
        const downstream = stagesAfter("plan")[0];
        if (downstream) {
            stages = markStaleFrom(stages, downstream);
        }
        await this.runRepository.update(run.id, { stages });

        await log.info({
            message: `Regenerated "${component.name}" — ${contract.props.length} prop(s) proposed.`
        });
        return controller.response.done("Plan contract regenerated.");
    }
}

export const RegeneratePlanTask = TaskDefinition.createImplementation({
    implementation: RegeneratePlanTaskImpl,
    dependencies: [
        RunRepository,
        JobRepository,
        StageArtifactStore,
        ComponentExtractionAi,
        ThemeManifestResolver,
        OverrideRepository,
        OverrideApplicator
    ]
});

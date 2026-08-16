import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type { GeneratedComponent, GenerateArtifact, PlanArtifact } from "~/domain/artifacts.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";
import { GENERATE_COMPONENT_TASK_ID } from "~/constants.js";
import { decideCoordination, initCoordinatorState, type CoordinatorState } from "./coordination.js";
import { generateResultKey, type ComponentResult } from "./componentGeneration.js";
import type { GenerateComponentTaskInput } from "./GenerateComponentTask.js";

// How many component tasks run at once. Bounded so the fan-out doesn't hammer the model API or spin up
// many concurrent sandbox renders (the same resource pressure that bit Capture) — isolation, not a stampede.
const GENERATE_CONCURRENCY = 4;
// How long a child may go without writing its result before the coordinator considers it lost and
// retries it. Comfortably above one component's worst case (MAX_ATTEMPTS slow generate+render calls).
const CHILD_TIMEOUT_MS = 8 * 60 * 1000;
// How many times one component may be (re)triggered before it's given up on as failed.
const CHILD_MAX_TRIGGERS = 2;
// Seconds between coordinator poll passes — slow enough not to hot-loop re-invocations while children work.
const POLL_SECONDS = 5;

const allPassed = (component: GeneratedComponent): boolean =>
    component.validation.textPreservation.passed &&
    component.validation.contractConformance.passed &&
    component.validation.tokenBinding.passed;

/**
 * Generate — a fan-out coordinator (not a single long task). It triggers one `GenerateComponentTask` per
 * planned component with bounded concurrency, re-invokes itself to poll each child's per-component result
 * artifact, retries a silent child and gives up on it after a timeout, and — once every component is
 * terminal — aggregates the results into the Generate artifact. Each component is its own visible task,
 * so a slow one can't block the rest and the run view shows real per-component progress.
 */
class GenerateHandlerImpl implements StageHandler.Interface {
    readonly stage = "generate" as const;

    constructor(private taskService: TaskService.Interface) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const planRef = context.upstream.plan;
        if (!planRef) {
            return Result.fail(new ExtractionValidationError("no plan to generate from"));
        }
        const planResult = await context.store.getJson<PlanArtifact>(planRef);
        if (planResult.isFail()) {
            return Result.fail(planResult.error);
        }
        const plan = planResult.value;
        if (!plan) {
            return Result.fail(new ExtractionValidationError("the plan artifact is empty"));
        }

        const signatures = plan.components.map(component => component.signature);
        const total = signatures.length;
        const nameOf = new Map(plan.components.map(c => [c.signature, c.name] as const));

        if (total === 0) {
            const key = context.artifactKey("components");
            const written = await context.store.putJson(key, {
                components: [],
                failed: []
            } satisfies GenerateArtifact);
            if (written.isFail()) {
                return Result.fail(written.error);
            }
            return Result.ok({ artifacts: { components: key }, counts: { components: 0 } });
        }

        // Coordinator checkpoint: per-signature lifecycle. Results themselves live in per-component
        // artifacts written by the child tasks (read at aggregation), not in this checkpoint.
        const checkpointKey = context.artifactKey("coordinator");
        const loaded = await context.store.getJson<CoordinatorState>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const state: CoordinatorState = loaded.value ?? initCoordinatorState(signatures);

        // Collect: flip any triggered component whose result artifact has appeared to `done`.
        for (const signature of signatures) {
            if (state.states[signature] !== "triggered") {
                continue;
            }
            const result = await context.store.getJson<ComponentResult>(
                generateResultKey(context.run.id, context.stageVersion, signature)
            );
            if (result.isOk() && result.value) {
                state.states[signature] = "done";
            }
        }

        const decision = decideCoordination(signatures, state, Date.now(), {
            concurrency: GENERATE_CONCURRENCY,
            timeoutMs: CHILD_TIMEOUT_MS,
            maxTriggers: CHILD_MAX_TRIGGERS
        });
        const next = decision.next;

        // Trigger the components the decision selected. A trigger that fails to enqueue drops back to
        // pending so the next poll retries it — one failed enqueue must not lose a component.
        for (const signature of decision.toTrigger) {
            const triggered = await this.taskService.trigger<GenerateComponentTaskInput>({
                definition: GENERATE_COMPONENT_TASK_ID,
                name: `Generate: ${nameOf.get(signature) ?? signature}`,
                input: {
                    runId: context.run.id,
                    signature,
                    stageVersion: context.stageVersion,
                    planRef
                }
            });
            if (triggered.isFail()) {
                next.states[signature] = "pending";
                await context.log.error({
                    message: `Could not start generation for "${nameOf.get(signature) ?? signature}": ${triggered.error.message}`
                });
            }
        }

        const saved = await context.store.putJson(checkpointKey, next);
        if (saved.isFail()) {
            return Result.fail(saved.error);
        }

        const settled = decision.counts.done + decision.counts.failed;
        await context.progress({
            message: `Generating components — ${decision.counts.done} done, ${decision.counts.running} running, ${decision.counts.pending} pending, ${decision.counts.failed} failed (of ${total}).`,
            current: settled,
            total
        });

        // Still working: yield and poll again shortly.
        if (!decision.done) {
            return Result.ok({
                artifacts: {},
                counts: { components: decision.counts.done },
                more: true,
                waitSeconds: POLL_SECONDS
            });
        }

        // Every component is terminal — aggregate the per-component results into the stage artifact.
        const components: GeneratedComponent[] = [];
        const failed: string[] = [];
        for (const signature of signatures) {
            const result = await context.store.getJson<ComponentResult>(
                generateResultKey(context.run.id, context.stageVersion, signature)
            );
            const component = result.isOk() ? result.value?.component : null;
            if (component) {
                components.push(component);
                if (!allPassed(component)) {
                    failed.push(signature);
                }
            } else {
                failed.push(signature);
            }
        }

        const key = context.artifactKey("components");
        const written = await context.store.putJson(key, {
            components,
            failed
        } satisfies GenerateArtifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Generated ${components.length} component(s); ${failed.length} did not pass validation.`
        });
        return Result.ok({
            artifacts: { components: key },
            counts: { components: components.length },
            degraded: failed
        });
    }
}

export const GenerateHandler = StageHandler.createImplementation({
    implementation: GenerateHandlerImpl,
    dependencies: [TaskService]
});

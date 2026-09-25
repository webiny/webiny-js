import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { RefineRemoteComponentUseCase } from "@webiny/remote-components/api/features/refineComponent/abstractions.js";
import { REGENERATE_COMPONENT_TASK_ID, stageArtifactKey } from "~/constants.js";
import { RunRepository, JobRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import { readComponent, toComponentRef } from "~/domain/generatedComponents.js";
import {
    bundleComponent,
    renderComponentText
} from "@webiny/remote-components/api/bundler/index.js";
import { flattenObservedValues } from "~/features/stages/generate/componentGeneration.js";
import {
    generateResultKey,
    type ComponentResult
} from "~/features/stages/generate/componentGeneration.js";
import type {
    GenerateArtifact,
    PlanArtifact,
    RenderArtifact,
    ValidationResult
} from "~/domain/artifacts.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import {
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding
} from "~/features/shared/validators.js";

export interface RegenerateTaskInput {
    runId: string;
    signature: string;
    instruction: string;
}

// Mirrors Generate's text-preservation budget: only the first N source fragments are asserted.
const PRESERVED_TEXT_LIMIT = 40;

type RunParams = TaskHandler.RunParams<RegenerateTaskInput>;
type RunResult = Promise<TaskHandler.Result<RegenerateTaskInput>>;

/**
 * Regenerate one generated component (W7.8) via the refine path — an AI edit of the component's current
 * source/css from the operator's instruction, rather than a fresh generation, so the work so far is the
 * starting point. The result is re-validated with the same three validators and replaces that component
 * in the Generate artifact; the component's stale render is dropped so the card re-renders on demand.
 */
class RegenerateComponentTaskHandlerImpl implements TaskHandler.Interface<RegenerateTaskInput> {
    constructor(
        readonly runRepository: RunRepository.Interface,
        readonly jobRepository: JobRepository.Interface,
        readonly artifactStore: StageArtifactStore.Interface,
        readonly refine: RefineRemoteComponentUseCase.Interface,
        readonly manifestResolver: ThemeManifestResolver.Interface
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

        const generate = stageEntry(run.stages, "generate");
        const componentsKey = generate?.artifacts.components;
        if (!generate || !componentsKey) {
            return controller.response.error("Generate has not produced components to refine.");
        }
        const generateVersion = generate.stageVersion;

        const generateArtifactResult =
            await this.artifactStore.getJson<GenerateArtifact>(componentsKey);
        if (generateArtifactResult.isFail() || !generateArtifactResult.value) {
            return controller.response.error("The generate artifact could not be read.");
        }
        const generateArtifact = generateArtifactResult.value;
        const index = generateArtifact.components.findIndex(
            component => component.signature === input.signature
        );
        if (index === -1) {
            return controller.response.error("The component to refine was not found.");
        }
        const entry = generateArtifact.components[index];

        const currentResult = await readComponent(this.artifactStore, entry);
        if (currentResult.isFail()) {
            return controller.response.error(currentResult.error.message);
        }
        const component = currentResult.value;

        // Refine from the current source/css, not the original plan prompt — preserving the work so far.
        const refined = await this.refine.execute({
            currentSource: component.source,
            currentCss: component.css,
            feedback: input.instruction
        });
        if (refined.isFail()) {
            await log.error({ message: `Refine failed: ${refined.error.message}` });
            return controller.response.error(refined.error.message);
        }
        const { source, css } = refined.value;

        // Re-validate. Source texts come from the Plan artifact (as in Generate); prop names are already
        // on the component. Token binding needs the pinned theme's valid variables.
        let sourceTexts: string[] = [];
        const planKey = stageEntry(run.stages, "plan")?.artifacts.plan;
        if (planKey) {
            const plan = await this.artifactStore.getJson<PlanArtifact>(planKey);
            if (plan.isOk() && plan.value) {
                const planned = plan.value.components.find(
                    item => item.signature === input.signature
                );
                sourceTexts = planned?.sourceTexts ?? [];
            }
        }

        let validVariables = new Set<string>();
        let manifestAvailable = false;
        const manifest = await this.manifestResolver.resolve(job.themeEntryId, job.themeVersion);
        if (manifest.isOk()) {
            manifestAvailable = true;
            validVariables = new Set(
                manifest.value.slots.flatMap(slot =>
                    slot.cssVariables.map(variable => variable.toLowerCase())
                )
            );
        }

        // Same checks Generate runs, including the render: a refined component is validated the way a
        // generated one is, or the operator gets a different verdict for the same code.
        let renderedText = "";
        let renderedValues: string[] = [];
        let bundling: ValidationResult = { passed: true, failures: [] };

        try {
            const bundled = await bundleComponent({
                name: component.name,
                source,
                css: css || undefined
            });
            renderedText = renderComponentText(bundled.bundled, component.name, component.props);
            renderedValues = flattenObservedValues(component.props);
        } catch (error) {
            bundling = { passed: false, failures: [(error as Error).message] };
        }

        const validation = {
            bundling,
            textPreservation: validateTextPreservation(
                sourceTexts.slice(0, PRESERVED_TEXT_LIMIT),
                renderedText,
                renderedValues,
                source
            ),
            contractConformance: validateContractConformance(
                component.props.map(prop => prop.name),
                source
            ),
            tokenBinding: manifestAvailable
                ? validateTokenBinding(css, validVariables)
                : {
                      passed: true,
                      failures: ["theme manifest unavailable; token binding not checked"]
                  }
        };

        const refinedComponent = { ...component, source, css, validation };

        // The component's own artifact is the source of truth now, so it is written first. `revision`
        // is bumped unconditionally: refining is a model call that may return byte-identical source,
        // and the admin's poll clears on this moving — if it were derived from content, a no-op refine
        // would leave the component spinning forever.
        const resultRef =
            "resultRef" in entry && entry.resultRef
                ? entry.resultRef
                : generateResultKey(run.id, generateVersion, input.signature);
        const previous = await this.artifactStore.getJson<ComponentResult>(resultRef);
        const revision = (previous.isOk() ? (previous.value?.revision ?? 0) : 0) + 1;

        const componentWritten = await this.artifactStore.putJson(resultRef, {
            signature: input.signature,
            component: refinedComponent,
            revision
        } satisfies ComponentResult);
        if (componentWritten.isFail()) {
            return controller.response.error(componentWritten.error.message);
        }

        // Then only this component's entry in the aggregate. The whole aggregate used to be rewritten
        // on every refine; nothing depended on that, and `failed` was spread through unchanged, so a
        // refine that fixed validation left the component listed as failed.
        const components = [...generateArtifact.components];
        components[index] = toComponentRef(refinedComponent, resultRef, revision);
        const failed = generateArtifact.failed.filter(
            signature =>
                signature !== input.signature ||
                !(
                    validation.textPreservation.passed &&
                    validation.contractConformance.passed &&
                    validation.tokenBinding.passed
                )
        );
        const written = await this.artifactStore.putJson(componentsKey, {
            ...generateArtifact,
            components,
            failed
        });
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }

        // The component's rendered screenshot is now stale — drop it so the card shows "not rendered".
        const rendersKey = stageArtifactKey(run.id, "generate", generateVersion, "renders");
        const renders = await this.artifactStore.getJson<RenderArtifact>(rendersKey);
        if (renders.isOk() && renders.value) {
            const remaining = renders.value.renders.filter(
                record => record.signature !== input.signature
            );
            if (remaining.length !== renders.value.renders.length) {
                await this.artifactStore.putJson(rendersKey, { renders: remaining });
            }
        }

        await log.info({ message: `Refined "${component.name}".` });
        return controller.response.done("Component refined.");
    }
}

const RegenerateComponentTaskHandler = TaskHandler.createImplementation({
    implementation: RegenerateComponentTaskHandlerImpl,
    dependencies: [
        RunRepository,
        JobRepository,
        StageArtifactStore,
        RefineRemoteComponentUseCase,
        ThemeManifestResolver
    ]
});

class RegenerateComponentTaskImpl implements TaskDefinition.Interface<RegenerateTaskInput> {
    readonly id = REGENERATE_COMPONENT_TASK_ID;
    readonly title = "Component extraction — regenerate component";
    readonly description = "Refines a single generated component from an instruction.";
    readonly maxIterations = 1;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = RegenerateComponentTaskHandler;
}

export const RegenerateComponentTask = TaskDefinition.createImplementation({
    implementation: RegenerateComponentTaskImpl,
    dependencies: []
});

import { Result } from "@webiny/feature/api";
import { stageArtifactKey } from "~/constants.js";
import type { GeneratedComponent, GenerateArtifact, RenderArtifact } from "~/domain/artifacts.js";
import type { ExtractionError } from "~/domain/errors.js";
import { toComponentRef } from "~/domain/generatedComponents.js";
import type { StageArtifactStore } from "~/domain/stage.js";
import { generateResultKey, type ComponentResult } from "./componentGeneration.js";

const allPassed = (component: GeneratedComponent): boolean =>
    component.validation.textPreservation.passed &&
    component.validation.contractConformance.passed &&
    component.validation.tokenBinding.passed;

export interface ReplaceGeneratedComponentInput {
    runId: string;
    /** The Generate stage version the run's components belong to. */
    stageVersion: number;
    /** The Generate artifact key on the run's ledger. */
    componentsKey: string;
    component: GeneratedComponent;
}

/**
 * Puts a new version of one component into a Generate stage that has already finished.
 *
 * The component's own result is written first — it is the source of truth — with its revision bumped
 * whatever the content, since the admin's poll clears on the revision moving. Then only that
 * component's entry in the aggregate is replaced, its failed/no-output standing recomputed, and its
 * rendered screenshot dropped, because it shows the old component.
 *
 * The aggregate is read immediately before it is written, to keep the window small: two replacements
 * of different components finishing in the same instant could still lose one entry, which a later
 * replacement or a Generate re-run restores.
 */
export const replaceGeneratedComponent = async (
    store: StageArtifactStore.Interface,
    input: ReplaceGeneratedComponentInput
): Promise<Result<{ revision: number }, ExtractionError>> => {
    const signature = input.component.signature;
    const resultRef = generateResultKey(input.runId, input.stageVersion, signature);

    const previous = await store.getJson<ComponentResult>(resultRef);
    const revision = (previous.isOk() ? (previous.value?.revision ?? 0) : 0) + 1;
    const componentWritten = await store.putJson(resultRef, {
        signature,
        component: input.component,
        revision
    } satisfies ComponentResult);
    if (componentWritten.isFail()) {
        return Result.fail(componentWritten.error);
    }

    const aggregate = await store.getJson<GenerateArtifact>(input.componentsKey);
    if (aggregate.isFail()) {
        return Result.fail(aggregate.error);
    }
    const current: GenerateArtifact = aggregate.value ?? { components: [], failed: [] };
    const ref = toComponentRef(input.component, resultRef, revision);
    const index = current.components.findIndex(entry => entry.signature === signature);
    const components = [...current.components];
    if (index === -1) {
        components.push(ref);
    } else {
        components[index] = ref;
    }
    const failed = current.failed.filter(item => item !== signature);
    if (!allPassed(input.component)) {
        failed.push(signature);
    }
    const noOutput = { ...(current.noOutput ?? {}) };
    delete noOutput[signature];
    const written = await store.putJson(input.componentsKey, {
        ...current,
        components,
        failed,
        ...(Object.keys(noOutput).length > 0 ? { noOutput } : { noOutput: undefined })
    } satisfies GenerateArtifact);
    if (written.isFail()) {
        return Result.fail(written.error);
    }

    const rendersKey = stageArtifactKey(input.runId, "generate", input.stageVersion, "renders");
    const renders = await store.getJson<RenderArtifact>(rendersKey);
    if (renders.isOk() && renders.value) {
        const remaining = renders.value.renders.filter(record => record.signature !== signature);
        if (remaining.length !== renders.value.renders.length) {
            await store.putJson(rendersKey, { renders: remaining });
        }
    }

    return Result.ok({ revision });
};

import { Result } from "@webiny/feature/api";
import { CreateRemoteComponentUseCase } from "@webiny/remote-components/api/features/createComponent/abstractions.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    AssembleArtifact,
    GenerateArtifact,
    PromoteArtifact,
    PromotedComponent
} from "~/domain/artifacts.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

/** Collision policy: keep both by renaming — suffix "(2)", "(3)", … until the name is free. */
const uniqueName = (name: string, taken: Set<string>): string => {
    if (!taken.has(name)) {
        return name;
    }
    let suffix = 2;
    while (taken.has(`${name} (${suffix})`)) {
        suffix++;
    }
    return `${name} (${suffix})`;
};

/**
 * Promote — deterministic, no model. Moves the job's generated components that passed validation into
 * the component Library via the create-from-code path. Applies the Keep-both-with-a-rename collision
 * policy. Permission is dual: the run-stage mutation gated this feature's permission, and
 * `CreateRemoteComponentUseCase` applies the components module's own authorization.
 */
class PromoteHandlerImpl implements StageHandler.Interface {
    readonly stage = "promote" as const;

    constructor(
        private createComponent: CreateRemoteComponentUseCase.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface
    ) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const assemblyRef = context.upstream.assembly;
        if (!assemblyRef) {
            return Result.fail(new ExtractionValidationError("no assembly to promote"));
        }
        const assemblyResult = await context.store.getJson<AssembleArtifact>(assemblyRef);
        if (assemblyResult.isFail()) {
            return Result.fail(assemblyResult.error);
        }
        const assembly = assemblyResult.value;
        if (!assembly) {
            return Result.fail(new ExtractionValidationError("the assembly artifact is empty"));
        }

        const generateResult = await context.store.getJson<GenerateArtifact>(
            assembly.componentsRef
        );
        if (generateResult.isFail()) {
            return Result.fail(generateResult.error);
        }
        const generate = generateResult.value;
        if (!generate) {
            return Result.fail(
                new ExtractionValidationError("the generated components are missing")
            );
        }

        // Existing names, so the collision policy can keep both.
        const existing = await this.listComponents.execute();
        const taken = new Set<string>(
            existing.isOk() ? existing.value.items.map(item => item.name) : []
        );

        const promoted: PromotedComponent[] = [];
        const skipped: string[] = [];

        for (const component of generate.components) {
            const passed =
                component.validation.textPreservation.passed &&
                component.validation.contractConformance.passed &&
                component.validation.tokenBinding.passed;
            if (!passed) {
                skipped.push(component.signature);
                continue;
            }

            const name = uniqueName(component.name, taken);
            const created = await this.createComponent.execute({
                name,
                label: component.name,
                description: `Extracted ${component.type} section`,
                source: component.source,
                css: component.css,
                status: "draft"
            });
            if (created.isFail()) {
                await context.log.error({
                    message: `Could not promote "${name}": ${created.error.message}`
                });
                skipped.push(component.signature);
                continue;
            }

            taken.add(name);
            promoted.push({ signature: component.signature, componentId: created.value.id, name });
        }

        const artifact: PromoteArtifact = { promoted, skipped };
        const key = context.artifactKey("promotion");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Promoted ${promoted.length} component(s) to the Library; skipped ${skipped.length}.`
        });
        return Result.ok({
            artifacts: { promotion: key },
            counts: { components: promoted.length }
        });
    }
}

export const PromoteHandler = StageHandler.createImplementation({
    implementation: PromoteHandlerImpl,
    dependencies: [CreateRemoteComponentUseCase, ListRemoteComponentsUseCase]
});

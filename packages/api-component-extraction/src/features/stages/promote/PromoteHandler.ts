import { Result } from "@webiny/feature/api";
import { CreateRemoteComponentUseCase } from "@webiny/remote-components/api/features/createComponent/abstractions.js";
import { UpdateRemoteComponentUseCase } from "@webiny/remote-components/api/features/updateComponent/abstractions.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { bundleComponent } from "@webiny/remote-components/api/bundler/index.js";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import { OverrideRepository } from "~/domain/abstractions.js";
import { decisionsFromOverrides, overridesForStage } from "~/domain/overrides.js";
import { stageEntry } from "~/domain/ledger.js";
import { readComponents } from "~/domain/generatedComponents.js";
import type { Correction } from "~/domain/types.js";
import type {
    AssembleArtifact,
    GenerateArtifact,
    PlanArtifact,
    PromoteArtifact,
    PromotedComponent,
    SkippedComponent
} from "~/domain/artifacts.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

/** The promote overrides for a component signature: whether it's selected, and its collision resolution. */
interface PromoteChoice {
    selected: boolean;
    collision?: Extract<Correction, { kind: "promote.collision" }>;
}

/**
 * The extraction's name sanitised into a namespace segment — alphanumerics only, so "Webiny -4" becomes
 * "Webiny4". A name with no alphanumerics yields "" (no prefix).
 */
const namespaceSegment = (jobName: string): string => jobName.replace(/[^a-zA-Z0-9]+/g, "");

/**
 * Build a component's bundle for the Library. Promote does this before it writes anything, so a
 * component that cannot be bundled is skipped rather than stored unplaceable — for a Replace that
 * also means a working Library component is never overwritten by one that does not build.
 */
const buildBundle = async (name: string, source: string, css?: string) => {
    const built = await bundleComponent({ name, source, css: css || undefined });

    return {
        bundledJs: built.bundled,
        bundledJsSha256: built.sha256,
        bundledCss: built.css ?? "",
        bundledCssSha256: built.cssSha256 ?? "",
        manifest: built.manifest
    };
};

/** Qualify a component name with the extraction namespace: "Webiny4" + "Hero" → "Webiny4/Hero". */
const qualify = (segment: string, name: string): string => (segment ? `${segment}/${name}` : name);

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
        private updateComponent: UpdateRemoteComponentUseCase.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface,
        private overrides: OverrideRepository.Interface
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

        // Existing names, so the collision policy can keep both — and their ids, so Replace can update in
        // place.
        const existing = await this.listComponents.execute();
        const existingItems = existing.isOk() ? existing.value.items : [];
        const taken = new Set<string>(existingItems.map(item => item.name));
        const existingIdByName = new Map<string, string>(
            existingItems.map(item => [item.name, item.id])
        );

        // The job's overrides (W8): the Promote corrections — which accepted components to promote and
        // how to resolve a Library name collision — and the accept/reject decisions, both now overrides
        // (keyed by cluster signature) so they reattach across runs.
        const jobOverrides = await this.overrides.listByJob(context.job.id);
        const allOverrides = jobOverrides.isOk() ? jobOverrides.value : [];
        const choices = new Map<string, PromoteChoice>();
        for (const override of overridesForStage(allOverrides, "promote")) {
            const choice = choices.get(override.structuralSignature) ?? { selected: true };
            if (override.correction.kind === "promote.select") {
                choice.selected = override.correction.selected;
            } else if (override.correction.kind === "promote.collision") {
                choice.collision = override.correction;
            }
            choices.set(override.structuralSignature, choice);
        }

        // When any decision exists, only accepted components are promoted; with none, every valid one is.
        const decisions = decisionsFromOverrides(allOverrides);
        /*
         * Decisions and choices recorded before the fingerprint changed (2026-10-08) are keyed by a
         * component's previous signature, which the plan keeps on its representative.
         */
        const legacyOf = new Map<string, string>();
        const planRef = stageEntry(context.run.stages, "plan")?.artifacts?.plan;
        if (planRef) {
            const plan = await context.store.getJson<PlanArtifact>(planRef);
            for (const planned of plan.isOk() ? (plan.value?.components ?? []) : []) {
                if (planned.representative?.legacySignature) {
                    legacyOf.set(planned.signature, planned.representative.legacySignature);
                }
            }
        }
        const recorded = <T>(
            bySignature: (signature: string) => T | undefined,
            signature: string
        ) => {
            const legacy = legacyOf.get(signature);
            return bySignature(signature) ?? (legacy ? bySignature(legacy) : undefined);
        };
        const hasDecisions = Object.keys(decisions).length > 0;

        // Every promoted component is namespaced under the extraction's name, e.g. "Webiny4/Hero".
        const namespace = namespaceSegment(context.job.name);

        // Promote reads each component's source and css to bundle it, so it resolves all of them.
        const resolved = await readComponents(context.store, generate);
        if (resolved.isFail()) {
            return Result.fail(resolved.error);
        }
        const generatedComponents = resolved.value;

        const promoted: PromotedComponent[] = [];
        const skipped: SkippedComponent[] = [];
        const total = generatedComponents.length;

        for (let index = 0; index < total; index++) {
            const component = generatedComponents[index];

            // Honour the operator's decisions first: a rejected component is never promoted, and once any
            // decision has been made, an undecided one is held back too (only explicit accepts promote).
            const decision = recorded(signature => decisions[signature], component.signature);
            if (decision === "rejected" || (hasDecisions && decision !== "accepted")) {
                skipped.push({
                    signature: component.signature,
                    reason:
                        decision === "rejected"
                            ? "rejected by operator"
                            : "not accepted by operator"
                });
                await context.progress({
                    message: `Skipped ${component.name} — ${
                        decision === "rejected"
                            ? "rejected by operator"
                            : "not accepted by operator"
                    } — ${index + 1}/${total}`,
                    current: index + 1,
                    total
                });
                continue;
            }
            // Gate promotion on the editability-critical checks only: text preservation (content is
            // intact) and contract conformance (every prop is exposed). Token binding is advisory — a
            // component that references a token outside the theme still renders and is editable, so it
            // should reach the Library flagged, not be silently dropped.
            const textCheck = component.validation.textPreservation;
            const propsCheck = component.validation.contractConformance;
            if (!textCheck.passed || !propsCheck.passed) {
                // A specific reason on the trail, so the user can tell a real problem from a strict check.
                const reasons: string[] = [];
                if (!textCheck.passed) {
                    reasons.push(`${textCheck.failures.length} text fragment(s) not reproduced`);
                }
                if (!propsCheck.passed) {
                    reasons.push(
                        `missing prop(s): ${propsCheck.failures
                            .map(failure => failure.replace(/^missing prop:\s*/, ""))
                            .join(", ")}`
                    );
                }
                skipped.push({ signature: component.signature, reason: reasons.join("; ") });
                await context.progress({
                    message: `Skipped ${component.name} — ${reasons.join("; ")} — ${index + 1}/${total}`,
                    current: index + 1,
                    total
                });
                await context.log.info({
                    message: `"${component.name}" not promoted. ${[...textCheck.failures, ...propsCheck.failures].slice(0, 8).join(" | ")}`
                });
                continue;
            }
            if (!component.validation.tokenBinding.passed) {
                await context.log.info({
                    message: `Promoting "${component.name}" with token-binding warnings: ${component.validation.tokenBinding.failures.join(", ")}`
                });
            }

            // Honour the operator's Promote selection: a component explicitly deselected is not promoted.
            const choice = recorded(signature => choices.get(signature), component.signature);
            if (choice && !choice.selected) {
                skipped.push({ signature: component.signature, reason: "deselected" });
                await context.progress({
                    message: `Skipped ${component.name} — deselected — ${index + 1}/${total}`,
                    current: index + 1,
                    total
                });
                continue;
            }

            // The Library name is the classified name namespaced under the extraction, e.g. "Webiny4/Hero".
            const qualifiedName = qualify(namespace, component.name);
            const collides = taken.has(qualifiedName);
            const resolution = choice?.collision?.resolution;

            // Replace: update the colliding Library component in place (the module has no version history,
            // so Replace is the latest-revision update; no "New version" option exists).
            if (collides && resolution === "replace") {
                const existingId = existingIdByName.get(qualifiedName);
                if (existingId) {
                    let replacement;
                    try {
                        replacement = await buildBundle(
                            qualifiedName,
                            component.source,
                            component.css
                        );
                    } catch (error) {
                        const message = (error as Error).message;
                        await context.log.error({
                            message: `Could not bundle "${qualifiedName}" for replacement: ${message}`
                        });
                        skipped.push({
                            signature: component.signature,
                            reason: `could not bundle: ${message}`
                        });
                        await context.progress({
                            message: `Skipped ${component.name} — could not bundle — ${index + 1}/${total}`,
                            current: index + 1,
                            total
                        });
                        continue;
                    }

                    const updated = await this.updateComponent.execute(existingId, {
                        label: qualifiedName,
                        source: component.source,
                        css: component.css,
                        bundle: replacement
                    });
                    if (updated.isFail()) {
                        await context.log.error({
                            message: `Could not replace "${qualifiedName}": ${updated.error.message}`
                        });
                        skipped.push({
                            signature: component.signature,
                            reason: `could not replace: ${updated.error.message}`
                        });
                        continue;
                    }
                    promoted.push({
                        signature: component.signature,
                        componentId: existingId,
                        name: qualifiedName
                    });
                    await context.progress({
                        message: `Replaced ${qualifiedName} in the Library — ${index + 1}/${total}`,
                        current: index + 1,
                        total
                    });
                    continue;
                }
            }

            // Keep both (default): use the operator's explicit rename if given (as-is, they know what they
            // want), else the namespaced name auto-suffixed until free.
            const requested =
                collides && resolution === "keepBoth" && choice?.collision?.renameTo
                    ? choice.collision.renameTo
                    : qualifiedName;
            const name = uniqueName(requested, taken);

            // Bundle before creating anything. The Library's invariant is that everything in it is
            // placeable, so a component that cannot be bundled is skipped exactly the way one that
            // fails validation is — never stored in a state it can never leave. The reason goes on the
            // run, which is where the operator is looking.
            let bundle;
            try {
                bundle = await buildBundle(name, component.source, component.css);
            } catch (error) {
                const message = (error as Error).message;
                await context.log.error({
                    message: `Could not bundle "${name}": ${message}`
                });
                skipped.push({
                    signature: component.signature,
                    reason: `could not bundle: ${message}`
                });
                await context.progress({
                    message: `Skipped ${component.name} — could not bundle — ${index + 1}/${total}`,
                    current: index + 1,
                    total
                });
                continue;
            }

            const created = await this.createComponent.execute({
                name,
                label: name,
                description: `Extracted ${component.type} section`,
                source: component.source,
                css: component.css,
                bundle
            });
            if (created.isFail()) {
                await context.log.error({
                    message: `Could not promote "${name}": ${created.error.message}`
                });
                skipped.push({
                    signature: component.signature,
                    reason: `could not create: ${created.error.message}`
                });
                continue;
            }

            taken.add(name);
            promoted.push({ signature: component.signature, componentId: created.value.id, name });
            await context.progress({
                message: `Promoted ${name} to the Library — ${index + 1}/${total}`,
                current: index + 1,
                total
            });
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
    dependencies: [
        CreateRemoteComponentUseCase,
        UpdateRemoteComponentUseCase,
        ListRemoteComponentsUseCase,
        OverrideRepository
    ]
});

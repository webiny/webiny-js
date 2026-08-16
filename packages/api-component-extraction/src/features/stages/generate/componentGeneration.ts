import { createHash, randomUUID } from "node:crypto";
import { createS3, PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { GenerateRemoteComponentUseCase } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { BlobStore } from "~/domain/stage.js";
import type { GeneratedComponent, PlannedComponent } from "~/domain/artifacts.js";
import { stageArtifactKey } from "~/constants.js";
import {
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding
} from "~/features/shared/validators.js";

const MAX_ATTEMPTS = 3;
// How many of a section's text fragments the prompt asks the model to preserve. Text preservation is
// validated against this SAME slice — validating against text the model was never given would fail every
// text-heavy section on content it never saw.
const PRESERVED_TEXT_LIMIT = 30;
// The theme's semantic slots are limited by design, but cap the in-prompt list so a pathological theme
// can't blow up the prompt. Bound variables are always shown, so the cap only trims the extra palette.
const MAX_PROMPT_VARIABLES = 150;

/** Where one component's generation result is written, so the coordinator can poll and collect it. */
export const generateResultKey = (runId: string, stageVersion: number, signature: string): string =>
    stageArtifactKey(
        runId,
        "generate",
        stageVersion,
        `result-${createHash("sha1").update(signature).digest("hex")}`
    );

/** The persisted per-component result: the best attempt (or null if none produced output). */
export interface ComponentResult {
    signature: string;
    component: GeneratedComponent | null;
}

export interface GenerationDeps {
    generateComponent: GenerateRemoteComponentUseCase.Interface;
    createFile: CreateFileUseCase.Interface;
    tenantContext: TenantContext.Interface;
    blobs: BlobStore.Interface;
}

export interface GenerationInput {
    runId: string;
    stageVersion: number;
    planned: PlannedComponent;
    validVariables: Set<string>;
    manifestAvailable: boolean;
    slotVariables: Map<string, string[]>;
    /** Durable log (errors worth keeping). */
    log: (message: string, error?: unknown) => Promise<void>;
    /** Live heartbeat (progress the operator watches). */
    beat: (message: string) => Promise<void>;
}

const buildPrompt = (
    component: PlannedComponent,
    slotVariables: Map<string, string[]>,
    feedback: string[] = []
): string => {
    const propLines = (prop: PlannedComponent["props"][number], indent: string): string[] => {
        const decor = `${prop.array ? "[]" : ""}${prop.optional ? "?" : ""}`;
        const sample = prop.observedValues.length
            ? `: e.g. ${prop.observedValues.slice(0, 3).join(" | ")}`
            : "";
        const line = `${indent}${prop.name} (${prop.type}${decor})${sample}`;
        const children = (prop.fields ?? []).flatMap(field => propLines(field, `  ${indent}`));
        return [line, ...children];
    };
    const props = component.props.flatMap(prop => propLines(prop, "- "));
    // Resolve each planned binding's slot path to the theme's real css variable name(s) — the model must
    // reference these exact names, not a name derived from the slot path.
    const bindings = component.tokenBindings.map(binding => {
        const names = slotVariables.get(binding.token) ?? [];
        return names.length > 0
            ? `- ${binding.target}: ${names.map(name => `var(${name})`).join(" or ")}`
            : `- ${binding.target}: theme token "${binding.token}" — use the closest allowed variable below`;
    });
    const allowed = [...new Set([...slotVariables.values()].flat())];
    const lines = [
        `Build a "${component.type}" website section component named "${component.name}".`,
        "Reproduce the section shown in the reference image.",
        "",
        "It must expose exactly these editable props (use these prop names):",
        ...(props.length ? props : ["- (no props; static content)"]),
        "",
        "Theme the component with these CSS variables:",
        ...(bindings.length ? bindings : ["- use the allowed theme variables listed below"]),
        ...(allowed.length > 0
            ? [
                  "",
                  "Use ONLY these theme CSS variables — any other var(--wby-*) fails validation; for anything without a suitable variable, use a plain CSS value:",
                  allowed
                      .slice(0, MAX_PROMPT_VARIABLES)
                      .map(name => `var(${name})`)
                      .join(", ")
              ]
            : []),
        "",
        "Preserve this text content exactly:",
        ...component.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT).map(text => `- ${text}`)
    ];
    // On a retry, tell the model precisely what the previous attempt got wrong so it can fix that rather
    // than re-rolling blindly — the single biggest lever on both pass rate and wasted attempts.
    if (feedback.length > 0) {
        lines.push(
            "",
            "Your previous attempt was rejected by automated validation. Fix EXACTLY these issues and keep everything that was already correct:",
            ...feedback.map(item => `- ${item}`)
        );
    }
    return lines.join("\n");
};

/** Whether two attempts produced the same set of validation failures (so a retry made no progress). */
const sameFailures = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    const seen = new Set(a);
    return b.every(item => seen.has(item));
};

/**
 * The retry instructions for the next attempt: the failures verbatim, plus — when the model invented
 * token variables — the actual valid ones to choose from (it cannot guess exact names).
 */
const buildRetryFeedback = (failures: string[], validVariables: Set<string>): string[] => {
    const feedback = [...failures];
    if (
        failures.some(item => item.startsWith("unknown token variable")) &&
        validVariables.size > 0
    ) {
        feedback.push(
            `Use ONLY these theme CSS variables (no others): ${[...validVariables]
                .slice(0, 60)
                .join(", ")}`
        );
    }
    return feedback;
};

/**
 * The reference image for the model: the section crop Segment already produced. Copied into a File
 * Manager record so the remote-components generation path can attach it. No cropping here — Segment is
 * the single place that reads the screenshot and derives crops.
 */
const createReferenceImage = async (
    deps: GenerationDeps,
    input: GenerationInput
): Promise<string | null> => {
    const cropRef = input.planned.representativeCrop.cropRef;
    if (!cropRef) {
        return null;
    }
    const cropResult = await deps.blobs.get(cropRef);
    if (cropResult.isFail()) {
        await input.log(`Could not read the section crop for "${input.planned.name}".`);
        return null;
    }
    try {
        const bytes = Buffer.from(cropResult.value);
        const tenant = deps.tenantContext.getTenant().id;
        const fileKey = `component-extraction/${input.runId}/${randomUUID()}.png`;
        await createS3().send(
            new PutObjectCommand({
                Bucket: String(process.env.S3_BUCKET),
                Key: `tenants/${tenant}/files/${fileKey}`,
                Body: bytes,
                ContentType: "image/png"
            })
        );
        const created = await deps.createFile.execute({
            key: fileKey,
            size: bytes.length,
            type: "image/png",
            name: `${input.planned.name} reference`,
            // A machine input for the generation call, not a media-library asset — skip AI enrichment.
            metadata: { aiImageEnrichment: false }
        });
        if (created.isFail()) {
            await input.log(
                `Could not create the reference file for "${input.planned.name}": ${created.error.message}`
            );
            return null;
        }
        return created.value.id;
    } catch (error) {
        await input.log(`Could not build the reference image for "${input.planned.name}".`, error);
        return null;
    }
};

/**
 * Generate one component: crop the reference, then generate + validate up to MAX_ATTEMPTS times, keeping
 * the least-broken attempt. Context-independent (no StageContext) so both the fan-out child task and any
 * inline caller share the exact same behaviour. Returns null when no attempt produced output.
 */
export const generateComponentAttempts = async (
    deps: GenerationDeps,
    input: GenerationInput
): Promise<GeneratedComponent | null> => {
    const { planned, validVariables, manifestAvailable, slotVariables } = input;
    const fileId = await createReferenceImage(deps, input);
    const additionalFileIds = fileId ? [fileId] : [];
    let best: GeneratedComponent | null = null;
    let bestFailureCount = Number.POSITIVE_INFINITY;
    let previousFailures: string[] | null = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        await input.beat(`"${planned.name}": generation attempt ${attempts}/${MAX_ATTEMPTS}…`);
        const feedback = previousFailures
            ? buildRetryFeedback(previousFailures, validVariables)
            : [];
        const generated = await deps.generateComponent.execute({
            prompt: buildPrompt(planned, slotVariables, feedback),
            name: planned.name,
            additionalFileIds
        });
        if (generated.isFail()) {
            await input.log(
                `Generate attempt ${attempts} failed for "${planned.name}": ${generated.error.message}`
            );
            continue;
        }

        const output = generated.value;
        const validation = {
            textPreservation: validateTextPreservation(
                planned.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT),
                output.source
            ),
            contractConformance: validateContractConformance(
                planned.props.map(prop => prop.name),
                output.source
            ),
            tokenBinding: manifestAvailable
                ? validateTokenBinding(output.css, validVariables)
                : {
                      passed: true,
                      failures: ["theme manifest unavailable; token binding not checked"]
                  }
        };
        const failures = [
            ...(validation.textPreservation.passed ? [] : validation.textPreservation.failures),
            ...(validation.contractConformance.passed
                ? []
                : validation.contractConformance.failures),
            ...(validation.tokenBinding.passed ? [] : validation.tokenBinding.failures)
        ];

        const candidate: GeneratedComponent = {
            signature: planned.signature,
            name: planned.name,
            type: planned.type,
            source: output.source,
            css: output.css,
            props: planned.props,
            tokenBindings: planned.tokenBindings,
            members: planned.members,
            attempts,
            validation
        };
        // Keep the least-broken attempt, not merely the last — an informed retry can still regress.
        if (failures.length < bestFailureCount) {
            best = candidate;
            bestFailureCount = failures.length;
        }

        if (failures.length === 0) {
            await input.beat(`"${planned.name}": passed validation on attempt ${attempts}.`);
            break;
        }
        // Stop early when a retry made no progress: identical failures mean the feedback isn't landing.
        if (previousFailures && sameFailures(previousFailures, failures)) {
            await input.beat(
                `"${planned.name}": not converging after ${attempts} attempt(s); stopping early.`
            );
            break;
        }
        previousFailures = failures;
        await input.beat(
            `"${planned.name}": attempt ${attempts} failed validation (${failures.length} issue(s)); retrying…`
        );
    }

    // Report the total attempts actually spent (the token cost), even when an earlier one was kept.
    return best ? { ...best, attempts } : null;
};

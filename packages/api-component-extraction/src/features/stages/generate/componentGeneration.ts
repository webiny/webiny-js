import { createHash, randomUUID } from "node:crypto";
import { createS3, PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { GenerateRemoteComponentUseCase } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { BlobStore } from "~/domain/stage.js";
import {
    bundleComponent,
    renderComponentText
} from "@webiny/remote-components/api/bundler/index.js";
import type {
    ComponentProp,
    GeneratedComponent,
    PlannedComponent,
    ValidationResult
} from "~/domain/artifacts.js";
import { stageArtifactKey } from "~/constants.js";
import {
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding,
    textsToPreserve
} from "~/features/shared/validators.js";

const MAX_ATTEMPTS = 3;
/*
 * Time limits for one component's attempts, which all run inside one task invocation and so inside one
 * Lambda's 15 minutes. A model call had no limit at all: a component whose example defaults ran long
 * (2424tulane's Floor Plan Filter) wrote until the Lambda was killed — twice — leaving no result, no
 * model-call record and no reason. Each call now gets at most PER_CALL_TIMEOUT_MS, never more than the
 * invocation has left after ATTEMPT_RESERVE_MS for bundling, validating and writing the result; and
 * no attempt starts with less than MIN_ATTEMPT_MS left, so the best attempt so far is always recorded.
 */
const PER_CALL_TIMEOUT_MS = 5 * 60 * 1000;
const ATTEMPT_RESERVE_MS = 60 * 1000;
const MIN_ATTEMPT_MS = 90 * 1000;

/**
 * Whether another attempt fits before `deadline`, and how long its model call may run. With no deadline
 * every attempt gets the full per-call limit.
 */
export const attemptBudget = (
    now: number,
    deadline: number | undefined
): { proceed: boolean; timeoutMs: number } => {
    if (deadline === undefined) {
        return { proceed: true, timeoutMs: PER_CALL_TIMEOUT_MS };
    }
    const remaining = deadline - now;
    if (remaining < MIN_ATTEMPT_MS) {
        return { proceed: false, timeoutMs: 0 };
    }
    return {
        proceed: true,
        timeoutMs: Math.min(PER_CALL_TIMEOUT_MS, remaining - ATTEMPT_RESERVE_MS)
    };
};
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
    /**
     * Bumped on every write. The aggregate copies it, and the admin's refine poll watches it rather
     * than comparing source — refining is a model call that may return byte-identical source, and a
     * poll waiting on content then never terminates.
     */
    revision: number;
    /**
     * Why no generation was attempted, when none was — set only for a component skipped before any
     * model call (no usable reference crop). A component whose attempts all failed leaves it unset.
     */
    notGenerated?: string;
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
    /**
     * Epoch ms by which the attempts must be over — the end of the invocation they run in, less a margin.
     * Absent means no deadline beyond each call's own limit.
     */
    deadline?: number;
}

/**
 * The section's measured type scale, as numbers.
 *
 * Measured on both sides, the generated component's type is not scaled from the section's — it is a
 * house size written regardless of it: 13 of 31 renders put their largest type at exactly 33px behind
 * source headings from 31px to 60px. Prose cannot fix that. "Match the section's proportions" pushes
 * the half that is already too large further out, because the same default is too small for a 60px
 * heading and too large for 14px body text. The model needs the numbers.
 *
 * The theme is the vocabulary: these are migrations onto the site's own extracted theme, so a size it
 * measured should have a role, and the variable is given where one is near. Where none is, the plain
 * value is what the contract already permits for anything without a suitable variable — and a run
 * with many of those is saying theme extraction missed the site's type scale.
 */
const typeScaleLines = (component: PlannedComponent): string[] => {
    const scale = component.typeScale ?? [];
    if (scale.length === 0) {
        return [];
    }
    const lines = scale.map(entry => {
        const line = entry.lineHeight ? `, line height ${entry.lineHeight}px` : "";
        const used = `${entry.elements} element${entry.elements === 1 ? "" : "s"}`;
        const how = entry.token
            ? `use var(${entry.token.cssVariable})`
            : `no theme variable is near this size — use ${entry.fontSize}px directly`;
        return `- ${entry.fontSize}px${line} (${used}) — ${how}`;
    });
    return [
        "",
        "The type sizes this section measured, largest first. Match them:",
        ...lines,
        "",
        `The largest is the section's heading at ${scale[0].fontSize}px. Do not substitute a default heading size for it.`
    ];
};

/**
 * The alignments the section's text uses.
 *
 * Measured across the four demo sites: 9 of 26 comparable sections centre text their source does not
 * centre, and every single difference goes that way — four right-aligned footers, three left-aligned
 * bodies, a CTA and a hero intro. Two more render left because the CSS declares no alignment and the
 * source is not left. Centre is the default a model reaches for when nothing says otherwise, and
 * until now nothing did: neither prompt contained the word.
 *
 * The last line is aimed at the measured direction rather than at alignment in general. It has to be,
 * because the sources are left 23, centre 16, right 6 — centring is right about a third of the time,
 * so an instruction that merely discouraged centring would break the sections that should be centred.
 *
 * **The number quoted is the one the order is by.** The first version ordered the lines by text area
 * and labelled them with element counts, so the two disagreed whenever a section's largest text was
 * not its most frequent: Park city's footer led with `right 5` above `center 7`, and Tulane's floor
 * plan filter led with `center 15` above `left 26`. The list told the model two different things, and
 * those are precisely the sections where the first version of this fix broke a correct alignment or
 * left one undeclared. A reader cannot tell which key ranks a list unless the list shows that key.
 */
const alignmentLines = (component: PlannedComponent): string[] => {
    const alignments = component.textAlignments ?? [];
    if (alignments.length === 0) {
        return [];
    }
    return [
        "",
        "The text alignment this section measured, by how much of its text each covers:",
        ...alignments.map(
            entry =>
                `- ${entry.align} — ${Math.round(entry.areaShare * 100)}% of the text (${entry.elements} element${entry.elements === 1 ? "" : "s"})`
        ),
        "",
        "Set text-align explicitly to match. Do not centre text this section does not centre."
    ];
};

/**
 * The background images the section paints.
 *
 * A hero whose photograph is a CSS background had nothing in the prompt describing it, and the
 * element beneath the photo still carries a `background-color` — so the largest measured colour in
 * Park city's hero was the terracotta fallback behind a dark blue city photograph, and the component
 * rendered as a flat terracotta block. `resolveSectionColours` no longer reports a colour an image
 * covers; this is the other half, and without it the hero would merely lose its wrong colour rather
 * than gain its right one.
 *
 * The URL is given as the page's own, exactly as the observed `<img>` values are, and with the same
 * instruction not to substitute anything else.
 */
const backgroundImageLines = (component: PlannedComponent): string[] => {
    const images = component.backgroundImages ?? [];
    if (images.length === 0) {
        return [];
    }
    return [
        "",
        "This section's background is painted with an image, not a colour. Set it as a CSS",
        "background-image on the section, with the sizing given:",
        ...images.map(image => {
            const how = [image.size, image.position, image.repeat].filter(Boolean).join(" / ");
            return `- ${image.url}${how ? ` — ${how}` : ""}`;
        }),
        "",
        "Use these URLs exactly as given. Do not substitute a stock photograph, and do not replace the",
        "image with a flat background colour."
    ];
};

/**
 * The section's measured colours, with the theme variable expressing each.
 *
 * Generate sees the crop, so it can see the hues — but not which of the fifty-odd allowed variables is
 * this section's background. And the bindings it is handed rarely say: of 73 on one site, 15 named a
 * background or surface at all, so the most dominant colour in a section is usually unbound and the
 * model picks a plausible surface token itself. Divergence barely moved with more bindings — 60% at a
 * handful, 36% at a dozen — which is why this goes to Generate as well as to Plan.
 *
 * The hex is given as the identity of the colour and the variable as the way to write it. A colour the
 * theme cannot express says so, because omitting it would leave the model to guess exactly the colour
 * this is meant to pin down.
 */
const colourLines = (component: PlannedComponent): string[] => {
    const colours = component.representative?.resolvedColours ?? [];
    if (colours.length === 0) {
        return [];
    }
    return [
        "",
        "The colours this section measured, largest area first. Use the variable given for each:",
        ...colours.map(colour =>
            colour.token
                ? `- ${colour.role} ${colour.hex} — use var(${colour.token.cssVariable})`
                : `- ${colour.role} ${colour.hex} — no theme variable is near this colour, use ${colour.hex} directly`
        ),
        "",
        "Do not substitute a different theme colour for one listed here, and do not write a hex value",
        "where a variable is given — a hardcoded colour survives no theme change."
    ];
};

/**
 * The prompt a component is generated from.
 *
 * Exported so the Generate screen can show it. Everything this project has fixed in generation was
 * fixed by changing what the model is told — image values, type sizes, colours, alignment, background
 * images — and each defect was first seen in a render and only then traced back to an absent line.
 * Reading the prompt is the shortest path from "this component is wrong" to "it was never told", and
 * it had to be reconstructed by hand every time.
 *
 * It is built, not recorded: the same function the stage calls, over the current plan artifact and the
 * current theme. So it shows what the next generation would send rather than what some earlier one
 * did, which is the question an operator is actually asking before pressing the button again.
 */
export const buildComponentPrompt = (
    component: PlannedComponent,
    slotVariables: Map<string, string[]>,
    feedback: string[] = []
): string => buildPrompt(component, slotVariables, feedback);

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

    /*
     * The values the section actually used, as the defaults this prop should ship with.
     *
     * Without them the model has a picture of a photograph and no photograph, and it does the only
     * thing it can: it writes a plausible stock URL into `defaults.inputs`. Measured before this
     * existed, 12 of 34 components across four sites shipped hardcoded `images.unsplash.com` URLs, and
     * Promote put them in the customer's Library — 49 of its 212 components carry them today.
     */
    const structuredLines = (prop: PlannedComponent["props"][number], indent: string): string[] => {
        const lines: string[] = [];
        for (const value of prop.observedStructured ?? []) {
            if (value.kind === "media") {
                lines.push(
                    `${indent}${prop.name}: ${value.src}${value.alt ? ` (alt: "${value.alt}")` : ""}`
                );
            } else if (value.kind === "link") {
                lines.push(`${indent}${prop.name}: "${value.label}" -> ${value.href}`);
            } else {
                const fields = Object.entries(value.fields)
                    .map(([name, field]) =>
                        typeof field === "string"
                            ? `${name}: "${field}"`
                            : "label" in field
                              ? `${name}: "${field.label}" -> ${field.href}`
                              : `${name}: ${field.src}`
                    )
                    .join(", ");
                lines.push(`${indent}${prop.name}[]: { ${fields} }`);
            }
        }
        return [...lines, ...(prop.fields ?? []).flatMap(field => structuredLines(field, indent))];
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
        ...colourLines(component),
        ...backgroundImageLines(component),
        ...typeScaleLines(component),
        ...alignmentLines(component),
        "",
        "Preserve this text content exactly:",
        ...textsToPreserve(component.sourceTexts)
            .slice(0, PRESERVED_TEXT_LIMIT)
            .map(text => `- ${text}`)
    ];

    const observed = component.props.flatMap(prop => structuredLines(prop, "- "));
    if (observed.length > 0) {
        lines.push(
            "",
            "These are the images and destinations the section itself used. Put them in the manifest's",
            "`defaults` as the default values for those inputs, exactly as given:",
            ...observed,
            "",
            "Do NOT invent image URLs. No stock photography, no placeholder services, no URL that is",
            "not in the list above — a component that ships one puts it in the customer's library."
        );
    }
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

/**
 * Every observed value on a prop tree, flattened. These are what the component had available to
 * render, and a source fragment built entirely out of values it did render counts as preserved —
 * observations are deduped per field, so the exact rows the page showed cannot be rebuilt from them.
 */
export const flattenObservedValues = (props: ComponentProp[]): string[] =>
    props.flatMap(prop => [
        ...(prop.observedValues ?? []),
        ...flattenObservedValues(prop.fields ?? [])
    ]);

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
 * The longest edge of the image the model is sent.
 *
 * Section crops are stored at true scale, so a tall one can be 1440x8000 — a PNG that can exceed the
 * per-image size a provider accepts. Anthropic downscales anything past 1568px on its long edge before
 * the model sees it, so fitting the image here first changes nothing the model receives, and keeps a
 * large crop from failing the call.
 */
const MODEL_IMAGE_MAX_EDGE = 1568;

const modelReferenceImage = async (crop: Uint8Array): Promise<Buffer> => {
    // Lazily: `sharp` is a Lambda-layer native module present on the background-task runtime only.
    const sharp = (await import("sharp")).default;
    return sharp(crop, { limitInputPixels: false })
        .resize({
            width: MODEL_IMAGE_MAX_EDGE,
            height: MODEL_IMAGE_MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true
        })
        .png()
        .toBuffer();
};

/** The reference image's File Manager id, or why there is none. */
type ReferenceImage = { fileId: string } | { failure: string };

/**
 * The reference image for the model: the section crop Segment already produced. Copied into a File
 * Manager record so the remote-components generation path can attach it. No cropping here — Segment is
 * the single place that reads the screenshot and derives crops.
 */
const createReferenceImage = async (
    deps: GenerationDeps,
    input: GenerationInput
): Promise<ReferenceImage> => {
    const cropRef = input.planned.representativeCrop?.cropRef;
    if (!cropRef) {
        return { failure: "no member of the cluster has a usable reference crop" };
    }
    const cropResult = await deps.blobs.get(cropRef);
    if (cropResult.isFail()) {
        await input.log(`Could not read the section crop for "${input.planned.name}".`);
        return { failure: `the reference crop could not be read: ${cropResult.error.message}` };
    }
    try {
        const bytes = await modelReferenceImage(cropResult.value);
        const tenant = deps.tenantContext.getTenant().id;
        /*
         * The id is passed explicitly AND the key is shaped `${id}/${filename}`, because File Manager
         * derives a file's id from the first segment of its key when none is given
         * (`CreateFileUseCase`: `const [id] = input.key.split("/")`).
         *
         * Keying these `component-extraction/${runId}/${uuid}.png` gave every reference image the id
         * "component-extraction": one File Manager record for all of them, each create overwriting
         * the last, every earlier object orphaned in S3. Generate fans out concurrently and passes
         * this id straight to the model call, so a component could be handed another component's
         * reference crop — or another run's. The crop is the visual ground truth for the generation,
         * so being handed the wrong one yields a component that looks well built and is of the wrong
         * section.
         *
         * The run id moves to metadata: it was in the key for grouping, and the key cannot carry it
         * without taking the id segment. Nothing deletes these by key prefix today, so nothing
         * depended on that grouping.
         */
        const fileId = randomUUID();
        const fileKey = `${fileId}/${input.planned.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-reference.png`;
        await createS3().send(
            new PutObjectCommand({
                Bucket: String(process.env.S3_BUCKET),
                Key: `tenants/${tenant}/files/${fileKey}`,
                Body: bytes,
                ContentType: "image/png"
            })
        );
        const created = await deps.createFile.execute({
            id: fileId,
            key: fileKey,
            size: bytes.length,
            type: "image/png",
            name: `${input.planned.name} reference`,
            // A machine input for the generation call, not a media-library asset — skip AI enrichment.
            metadata: { aiImageEnrichment: false, componentExtractionRunId: input.runId }
        });
        if (created.isFail()) {
            await input.log(
                `Could not create the reference file for "${input.planned.name}": ${created.error.message}`
            );
            return {
                failure: `the reference image could not be created: ${created.error.message}`
            };
        }
        return { fileId: created.value.id };
    } catch (error) {
        await input.log(`Could not build the reference image for "${input.planned.name}".`, error);
        return {
            failure: `the reference image could not be built: ${
                error instanceof Error ? error.message : String(error)
            }`
        };
    }
};

/**
 * What one component's generation came to. `notGenerated` is set, with the reason, when nothing was
 * attempted; `component` is null then, and also when every attempt failed (with no reason).
 */
export interface GenerationOutcome {
    component: GeneratedComponent | null;
    notGenerated?: string;
}

/**
 * Generate one component: crop the reference, then generate + validate up to MAX_ATTEMPTS times, keeping
 * the least-broken attempt. Context-independent (no StageContext) so both the fan-out child task and any
 * inline caller share the exact same behaviour.
 *
 * No reference image, no model call. The prompt tells the model to reproduce the section shown in the
 * image; sent without one, it pays for a component of nothing in particular that can still pass every
 * validator. So when the image cannot be made the component is returned as not generated, with why.
 */
export const generateComponentAttempts = async (
    deps: GenerationDeps,
    input: GenerationInput
): Promise<GenerationOutcome> => {
    const { planned, validVariables, manifestAvailable, slotVariables } = input;
    const reference = await createReferenceImage(deps, input);
    if ("failure" in reference) {
        await input.log(`"${planned.name}" not generated: ${reference.failure}.`);
        return { component: null, notGenerated: reference.failure };
    }
    const additionalFileIds = [reference.fileId];
    let best: GeneratedComponent | null = null;
    let bestFailureCount = Number.POSITIVE_INFINITY;
    let previousFailures: string[] | null = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
        const budget = attemptBudget(Date.now(), input.deadline);
        if (!budget.proceed) {
            await input.log(
                `"${planned.name}": stopping after ${attempts} attempt(s) — too little time left for another.`
            );
            break;
        }
        attempts++;
        await input.beat(`"${planned.name}": generation attempt ${attempts}/${MAX_ATTEMPTS}…`);
        const feedback = previousFailures
            ? buildRetryFeedback(previousFailures, validVariables)
            : [];
        const generated = await deps.generateComponent.execute({
            prompt: buildPrompt(planned, slotVariables, feedback),
            name: planned.name,
            additionalFileIds,
            abortSignal: AbortSignal.timeout(budget.timeoutMs)
        });
        if (generated.isFail()) {
            await input.log(
                `Generate attempt ${attempts} failed for "${planned.name}": ${generated.error.message}`
            );
            continue;
        }

        const output = generated.value;

        /*
         * Bundle and render before checking text.
         *
         * Text preservation asks whether the component puts the page's text on the page, which cannot
         * be answered from the source code: a correctly parameterised component does not contain the
         * text, because the text arrives as a prop. So the candidate is bundled and rendered with the
         * values Plan observed, and the check runs against what came out.
         *
         * This bundle is for validation only and is thrown away. Promote builds the bundle that is
         * stored, from the source that was actually promoted — bundling here would otherwise be work
         * done for components that are never promoted, and two bundles that could disagree.
         */
        let renderedText = "";
        let renderedValues: string[] = [];
        let bundling: ValidationResult = { passed: true, failures: [] };

        try {
            const bundled = await bundleComponent({
                name: planned.name,
                source: output.source,
                css: output.css || undefined
            });
            renderedValues = flattenObservedValues(planned.props);

            try {
                renderedText = renderComponentText(bundled.bundled, planned.name, planned.props);
            } catch {
                /*
                 * A render that throws is not a bundle failure and not a text failure.
                 *
                 * It is this check's own limitation: the props are synthesised from observations, and
                 * a component reaching into a value the pipeline never observed can fault on data it
                 * would never see from a real instance. Failing the component for that would reject
                 * working code for a shortcoming of the validator. The text check falls back to the
                 * renderable source, which is the same evidence it uses for a branch this render did
                 * not take.
                 */
                renderedText = "";
            }
        } catch (error) {
            // Bundling itself failed: the component cannot be built, which is a real defect and a
            // different remedy from missing text.
            bundling = {
                passed: false,
                failures: [(error as Error).message]
            };
        }

        const validation = {
            bundling,
            textPreservation: validateTextPreservation(
                textsToPreserve(planned.sourceTexts).slice(0, PRESERVED_TEXT_LIMIT),
                renderedText,
                renderedValues,
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
            ...(validation.bundling.passed ? [] : validation.bundling.failures),
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
    return { component: best ? { ...best, attempts } : null };
};

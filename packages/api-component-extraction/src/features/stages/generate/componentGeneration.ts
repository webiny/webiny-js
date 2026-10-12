import { Result } from "@webiny/feature/api";
import { createHash, randomUUID } from "node:crypto";
import { createS3, PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { GenerateRemoteComponentUseCase } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { BlobStore } from "~/domain/stage.js";
import type {
    GenerationEffort,
    GenerationTrace
} from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { SYSTEM_PROMPT_LINE_IDS } from "@webiny/remote-components/api/features/generateComponent/buildComponentPrompt.js";
import type { AttemptRecord } from "./generationLog.js";
import {
    bundleComponent,
    renderComponentMarkup
} from "@webiny/remote-components/api/bundler/index.js";
import type { RenderedFile } from "@webiny/remote-components/api/bundler/index.js";
import type {
    ComponentProp,
    GeneratedComponent,
    PlannedComponent,
    SpacingEntry,
    ValidationResult
} from "~/domain/artifacts.js";
import { isTranslucent } from "~/features/shared/translucency.js";
import { createCopyAttribution, ownStructuredValues } from "./copyAttribution.js";
import type { SystemPromptOverride } from "./themeVocabulary.js";
import {
    bindingCrossesFamily,
    bindingIsSectionBackground,
    crossesFamily
} from "./colourFamilies.js";
import { rematchColours, rematchUnderImage } from "~/features/stages/cluster/resolvedColours.js";
import type { ThemeManifest } from "@webiny/theme-common";
import { roleAwareTypeToken, themeTypeRoles } from "~/features/stages/plan/sectionTypeScale.js";
import { stageArtifactKey } from "~/constants.js";
import {
    combineValidation,
    sourceTextPool,
    validateNoInventedText,
    validateRenderedFiles,
    validateRenderedValues,
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
/**
 * How much the model may think before answering. Its default (high) spent about three quarters of
 * billed output on thinking and ran the Site Header and Footer into PER_CALL_TIMEOUT_MS; medium kept
 * the checks and generated every component. See
 * `scripts/baseline/reports/2026-10-08/effort-result.md`.
 */
export const GENERATION_EFFORT: GenerationEffort = "medium";

/*
 * Seven minutes, not five (2026-10-09, `reports/2026-10-09/footer-per-call-limit.md`). Five was set when
 * a cut-off call left nothing; the call streams now, and `attemptBudget` is what guarantees the recorded
 * result. Measured at 92-142 output tokens a second, a call reaches MAX_OUTPUT_TOKENS (32K) in 230-350
 * s, so the cap already bounds a runaway; five minutes was cutting off answers the cap would have let
 * finish (the Footer, 27-28K tokens, timed out on one attempt in two). At seven the cap binds first at
 * any rate down to about 76 tokens a second.
 */
const PER_CALL_TIMEOUT_MS = 7 * 60 * 1000;
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

/**
 * Stable ids for the prompt lines a prompt experiment may leave out (see the ablation design,
 * `scripts/baseline/reports/2026-10-08/ablation-design.md`). The extraction prompt's own lines, plus the
 * shared system prompt's (`SYSTEM_PROMPT_LINE_IDS`). Nothing else can be removed.
 */
// The two content prohibitions: no-other-text measured live (prohibitions-result.md); empty-destination
// replaced "Do NOT invent image URLs" after measuring both against no line (link-wording-result.md).
// "Use these URLs exactly as given" measured dead and removed.
export const EXTRACTION_PROMPT_LINE_IDS = [
    "extraction.empty-destination",
    "extraction.no-other-text"
] as const;

/**
 * The accessibility and performance instructions (site-qualities-scoping.md, item 4), by id. Each
 * has the data it needs in the prompt: the alt beside every image, the source's heading levels, the
 * section's form fields. Image width and height is not among them: a file input's value carries only
 * its URL, so an instruction to read its size would read nothing (item4-instructions.md).
 */
export const QUALITY_PROMPT_LINE_IDS = [
    "quality.alt-input",
    "quality.semantic-elements",
    "quality.heading-level",
    "quality.form-labels",
    "quality.focus-visible"
] as const;

/**
 * Candidate lines a prompt experiment may add, by id. Never shown otherwise: a candidate ships only
 * once it is measured and made a default line. Pending: the quality instructions, until they are
 * read, agreed and their generation run is scheduled.
 */
export const OPT_IN_PROMPT_LINE_IDS: readonly string[] = [...QUALITY_PROMPT_LINE_IDS];

/**
 * The shared system prompt's lines this pipeline leaves out on every call: its own override of the
 * shared prompt, which other callers keep. Each was measured dead for extraction at the resolution
 * stated in `scripts/baseline/reports/2026-10-08/ablation-result.md` — zero failures in 9 runs on three
 * single-copy components, which bounds the rate rather than proving it zero.
 */
const SYSTEM_PROMPT_OVERRIDE: readonly string[] = ["system.rule-17-multiple"];
export const PROMPT_LINE_IDS: readonly string[] = [
    ...EXTRACTION_PROMPT_LINE_IDS,
    ...SYSTEM_PROMPT_LINE_IDS
];

/** The prompt lines an experiment leaves out (`ablate`) and the candidate lines it adds (`include`). */
type Ablation = ReadonlySet<string>;
const NO_ABLATION: Ablation = new Set();

export interface GenerationInput {
    runId: string;
    stageVersion: number;
    planned: PlannedComponent;
    validVariables: Set<string>;
    manifestAvailable: boolean;
    slotVariables: Map<string, string[]>;
    /** Prompt lines to leave out, by id, for a prompt experiment. Never set outside one. */
    ablate?: readonly string[];
    /** Candidate prompt lines to add, by id (`OPT_IN_PROMPT_LINE_IDS`), for a prompt experiment. */
    include?: readonly string[];
    /**
     * Install this output instead of calling the model: one attempt, validated and stored like any
     * other. For taking an earlier logged attempt (an experiment's, say) as the component.
     */
    install?: { source: string; css: string };
    /** How much the model may think, for an effort experiment. Unset: GENERATION_EFFORT. */
    effort?: GenerationEffort;
    /** The theme's own vocabulary for the shared system prompt; see `systemPromptOverride`. */
    systemOverride?: SystemPromptOverride;
    /** Durable log (errors worth keeping). */
    log: (message: string, error?: unknown) => Promise<void>;
    /** Live heartbeat (progress the operator watches). */
    beat: (message: string) => Promise<void>;
    /**
     * Epoch ms by which the attempts must be over — the end of the invocation they run in, less a margin.
     * Absent means no deadline beyond each call's own limit.
     */
    deadline?: number;
    /** Called after each attempt with what was sent, what it cost and how it ended — for the log. */
    recordAttempt?: (record: AttemptRecord) => Promise<void>;
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
    const lines = scale.flatMap(entry => {
        const line = entry.lineHeight ? `, line height ${entry.lineHeight}px` : "";
        const used = `${entry.elements} element${entry.elements === 1 ? "" : "s"}`;
        const how = entry.token
            ? `use var(${entry.token.cssVariable})`
            : `no theme variable is near this size — use ${entry.fontSize}px directly`;
        const example = entry.example ? ` "${entry.example}"` : "";
        const style = [
            entry.fontWeight ? `weight ${entry.fontWeight}` : null,
            entry.textTransform
                ? `${entry.textTransform} (text-transform: ${entry.textTransform})`
                : null,
            entry.letterSpacing ? `letter-spacing ${entry.letterSpacing}px` : null,
            entry.italic ? "italic" : null
        ].filter(Boolean);
        const family = entry.fontFamily
            ? entry.fontFamilyToken
                ? `font-family: var(${entry.fontFamilyToken.cssVariable})`
                : `font-family: ${entry.fontFamily} — the theme has no variable for it, so set it as given`
            : null;
        return [
            `- ${entry.fontSize}px${line} (${used}${example}) — ${how}`,
            ...(style.length > 0 || family
                ? [`  ${[...style, ...(family ? [family] : [])].join("; ")}`]
                : [])
        ];
    });
    return [
        "",
        "The type this section measured, largest first — size, then the style that sets each apart. Match",
        "them, including case: text the page displays in capitals is uppercase through text-transform, not",
        "retyped, so keep the text as given and set the transform.",
        ...lines,
        // "Do not substitute a default heading size for it" was measured dead and removed: see
        // `scripts/baseline/reports/2026-10-08/ablation-result.md`.
        ...(largestIsSourceHeading(component)
            ? ["", `The largest is the section's heading at ${scale[0].fontSize}px.`]
            : [])
    ];
};

const comparable = (text: string): string =>
    text
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/…$/, "")
        .replace(/^["“”]+|["“”]+$/g, "")
        .trim();

/**
 * Whether the section's largest text is one of its source headings: the type scale's largest example
 * matched against the `h1`–`h6` text the source marks up.
 *
 * "The largest is the section's heading" used to be said of every section. Replayed over 385
 * components (2026-10-12), it named a heading the source does not have for 103 of the 289 with a type
 * scale (footers, navigation, cards), and for 14 more the largest text was a quote, a statistic ("80")
 * or a display word, not the heading. It is said only where it can be checked and holds; a plan that
 * recorded no example cannot be checked, and the heading lines carry the levels either way.
 */
const largestIsSourceHeading = (component: PlannedComponent): boolean => {
    const example = comparable(component.typeScale?.[0]?.example ?? "");
    if (!example) {
        return false;
    }
    return (component.headings ?? [])
        .flatMap(heading => [heading.text, ...heading.inner])
        .map(comparable)
        .some(text => text !== "" && (text.startsWith(example) || example.startsWith(text)));
};

/**
 * The section's headings as the source marks them up: the level each `h1`–`h6` declares and its
 * text, in page order. Data only, with no instruction attached. A section the source marks up with
 * no heading gets no lines. Text inside a heading's child elements is listed apart from its own text,
 * because the captured tree does not record which comes first.
 */
const headingLines = (component: PlannedComponent): string[] => {
    const headings = component.headings ?? [];
    if (headings.length === 0) {
        return [];
    }
    return [
        "",
        "The section's headings, as the source page marks them up, in page order:",
        ...headings.map(heading => {
            const inner = heading.inner.map(text => `"${text}"`).join(", ");
            if (!heading.text) {
                return `- h${heading.level} ${inner}`;
            }
            return `- h${heading.level} "${heading.text}"${inner ? `, with ${inner} inside it` : ""}`;
        })
    ];
};

/** Whether the prompt gives this section any picture: a bound image, an unbound one, or a sized one. */
const hasImages = (component: PlannedComponent): boolean =>
    (component.images?.length ?? 0) > 0 ||
    (component.unboundImages?.length ?? 0) > 0 ||
    component.props.some(prop => JSON.stringify(prop.observedStructured ?? []).includes('"src"'));

/** Whether the section's layout holds a form field (an input, a select, a text area). */
const hasFormFields = (component: PlannedComponent): boolean =>
    (component.layout?.elements ?? []).some(element => element.kind === "field");

/**
 * The accessibility instructions, each shown only when its id is included (`QUALITY_PROMPT_LINE_IDS`)
 * and only where the section has what it speaks about. Each refers to data the prompt carries above:
 * the alt given for each image, the headings the source marks up, the form fields in the layout.
 */
const qualityLines = (component: PlannedComponent, include: Ablation): string[] => {
    const lines: string[] = [];
    if (include.has("quality.alt-input") && hasImages(component)) {
        lines.push(
            "",
            "Every <img> takes its alt text from an input; none is written into the markup. Beside each",
            'image input, declare a text input named after it with "Alt" added (`image` → `imageAlt`,',
            "`logo` → `logoAlt`); inside a list or object item, add the same-named text field beside the",
            "image field. Default each to the alt given for that image above. An image given no alt above",
            'defaults to an empty string and renders alt="": it is decoration, and a screen reader skips it.'
        );
    }
    if (include.has("quality.semantic-elements")) {
        lines.push(
            "",
            "Use the element that says what each thing is: <a href> for anything that goes somewhere,",
            "<button> for an action that stays on the page, <ul> or <ol> around a set of like items (cards,",
            "links, features), <nav> around a set of navigation links, and <header> or <footer> as the outer",
            "element when this component is the site's header or footer. Never a <div> or <span> with a",
            "click handler."
        );
    }
    if (include.has("quality.heading-level")) {
        const headings = component.headings ?? [];
        const main = headings[0];
        lines.push(
            "",
            ...(main
                ? [
                      "The section's main heading is the first one listed under its headings above. Render it",
                      "with the element a `headingLevel` input names: declare `headingLevel` as a",
                      "`createSelectInput` with the options h1, h2, h3, h4, h5 and h6, defaulting to",
                      `"h${main.level}", and render it as \`const Heading = inputs.headingLevel || "h${main.level}"\`. Each`,
                      "page sets its own level. Every other listed heading keeps its distance from the main one: a",
                      "heading listed one level below it renders one level below `headingLevel`, never deeper than",
                      "h6. Text the list does not name as a heading is not a heading element, however large it is."
                  ]
                : [
                      "The source marks up no heading in this section: render no h1–h6 element, however large",
                      "its text."
                  ])
        );
    }
    if (include.has("quality.form-labels") && hasFormFields(component)) {
        lines.push(
            "",
            "Every form field has a <label> tied to it (`htmlFor` on the label, the same `id` on the",
            "field), carrying that field's label from the text above. Where the crop shows the field with",
            "no visible label, keep the label and hide it visually (a visually-hidden class), so a screen",
            "reader still reads it. A placeholder is not a label."
        );
    }
    if (include.has("quality.focus-visible")) {
        lines.push(
            "",
            "Every link, button and form field shows a visible focus indicator when reached with the",
            "keyboard: keep the browser's outline, or replace it in `:focus-visible` with one at least as",
            "visible (a 2px outline in the section's text colour). Never set `outline: none` without a",
            "replacement."
        );
    }
    return lines;
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
        // "Do not centre text this section does not centre" was measured dead and removed (ablation-result.md).
        "Set text-align explicitly to match."
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
    const all = component.backgroundImages ?? [];
    const sizing = (image: (typeof all)[number]) => {
        const how = [image.size, image.position, image.repeat].filter(Boolean).join(" / ");
        return `- ${image.url}${how ? ` — ${how}` : ""}`;
    };
    const covers = all.filter(image => !isTranslucent(image));
    const tints = all.filter(image => isTranslucent(image));
    const lines: string[] = [];
    if (covers.length > 0) {
        lines.push(
            "",
            "This section's background is painted with an image, not a colour. Set it as a CSS",
            "background-image on the section, with the sizing given:",
            // "Use these URLs exactly as given…" was measured dead (prohibitions-result.md): 14 of 14
            // used the URL verbatim, as a background, without it.
            ...covers.map(sizing)
        );
    }
    if (tints.length > 0) {
        lines.push("", ...tintLines(tints, sizing));
    }
    return lines;
};

/**
 * A see-through background image: a pattern, a texture or a mark the colour behind it shows through.
 *
 * Worded apart from photographs, because the photograph wording — "painted with an image, not a colour"
 * — is the opposite of true for these: Park city's pattern is white lines at 10-20% opacity, and what
 * the section looks like is the colour under it. That colour is the one Plan measured where the image is
 * drawn (`colourUnderImage`), not the first background in the colour list: there the largest colour is
 * the navy panel in front of the pattern, and naming it put the pattern over navy. Where no colour was
 * measured, none is named.
 */
const tintLines = (
    tints: NonNullable<PlannedComponent["backgroundImages"]>,
    sizing: (image: NonNullable<PlannedComponent["backgroundImages"]>[number]) => string
): string[] =>
    tints.flatMap(image => {
        const opacity = `about ${Math.round((image.opacity ?? 0) * 100)}% opaque`;
        // A token the colour lines would refuse (a status or border colour) is refused here too.
        const under = image.under
            ? image.under.token && !crossesFamily("background", image.under.token.path)
                ? `var(${image.under.token.cssVariable}) (${image.under.hex})`
                : `${image.under.hex} (no theme variable is near this colour, use it directly)`
            : null;
        return [
            `This section's background has a mostly see-through image drawn over a colour (${opacity}):`,
            "the colour shows through it and is what the section looks like there.",
            ...(under
                ? [`Under it, paint ${under}, and set the image over it as a CSS background-image:`]
                : [
                      "Paint the colour the reference image shows through it, and set the image over it as a",
                      "CSS background-image:"
                  ]),
            sizing(image)
        ];
    });

/**
 * The section's images that no prop carries — logos, badges, marks the contract left out.
 *
 * Without this the model sees them in the crop, has no URL for them, and has been told never to invent
 * one, so it drops them: every G5 footer lost its management-company logo that way. Each is offered
 * as an image input with the page's URL as its default, so it stays editable rather than baked in.
 */
export const unboundImageLines = (component: PlannedComponent): string[] => {
    const images = component.unboundImages ?? [];
    if (images.length === 0) {
        return [];
    }
    return [
        "",
        "The section also shows these images, which none of the inputs above carry. Keep each one, at",
        "about the size given, as an image input (`createFileInput`) whose default is its URL:",
        ...images.map(
            image =>
                `- ${image.url} — ${image.width}x${image.height}px${image.alt ? ` (alt: "${image.alt}")` : ""}`
        )
    ];
};

const SPACING_KIND: Record<SpacingEntry["kind"], string> = {
    section: "section padding, top and bottom",
    container: "padding inside cards, panels and containers",
    gap: "gap between items in a stack or row",
    "control-y": "padding inside buttons and inputs, top and bottom",
    "control-x": "padding inside buttons and inputs, left and right"
};

/**
 * The spacing the section measured, by the job each value does.
 *
 * Captured on every element and read by nothing before this, while the shared prompt's examples spaced
 * components with the library's scale. Each kind is given as the theme's variable for it where that
 * carries the section's value, and as px where it does not. On the five demo sites it mostly does not:
 * the themes' spacing slots were not measured from these sections.
 *
 * Where it does not, the line says what the variable renders instead. Told only "use 16px directly",
 * the model wrote `var(--wby-space-gap, 16px)` — the right number, as the fallback of a variable that
 * renders 30px on that theme, so the number never applied (8 of 10 such declarations after the spacing
 * fix). A fact about this theme rather than a rule: the ablation found the model follows accurate
 * specifics and ignores general prohibitions.
 */
const spacingLines = (component: PlannedComponent): string[] => {
    const spacing = component.spacing ?? [];
    if (spacing.length === 0) {
        return [];
    }
    return [
        "",
        "The spacing this section measured — the most common value of each kind, and how many elements use it:",
        ...spacing.map(
            entry =>
                `- ${SPACING_KIND[entry.kind]}: ${entry.px}px (${entry.elements}) — ${
                    entry.token
                        ? `use var(${entry.token.cssVariable})`
                        : entry.otherSlot
                          ? `write ${entry.px}px as a plain value, not inside a variable: var(${entry.otherSlot.cssVariable}) renders ${entry.otherSlot.px}px on this theme, so ${entry.px}px in its fallback would never apply`
                          : `no theme variable carries this value, use ${entry.px}px directly`
                }`
        )
    ];
};

/**
 * The section's measured geometry: its size and where each element sits.
 *
 * Without it the model sizes everything from a downscaled picture: Freehill's 340x108 header logo came
 * out at a third of that, and a fifth of the baseline's components rendered outside 0.67-1.5x of their
 * section's height.
 */
export const layoutLines = (component: PlannedComponent): string[] => {
    const layout = component.layout;
    if (!layout || layout.elements.length === 0) {
        return [];
    }
    return [
        "",
        `The section measures ${layout.width}x${layout.height}px. Its elements, in px from the section's top-left`,
        "(x,y and width x height), in reading order:",
        ...layout.elements.map(
            element =>
                `- ${element.kind} ${element.label} at ${element.x},${element.y} — ${element.width}x${element.height}`
        ),
        ...(layout.omitted > 0 ? [`(${layout.omitted} smaller text element(s) not listed.)`] : []),
        "",
        "Match these sizes and positions — the section's height, each picture's size, where text sits",
        "and how wide it runs. Use relative units where the layout must stretch, but keep the proportions."
    ];
};

/**
 * The section's pictures, by the part each plays, with tone.
 *
 * The crop cannot say whether a photograph is a backdrop or content, and it cannot say that a logo is
 * white on transparent: Freehill's footer put its white logo on a white panel.
 */
export const imageFactLines = (component: PlannedComponent): string[] => {
    const images = component.images ?? [];
    if (images.length === 0) {
        return [];
    }
    const role = {
        background: "the section's background (CSS background-image)",
        "fills-section": "covers the section, behind its content",
        inline: "an element in the section"
    } as const;
    const tone = (image: (typeof images)[number]) => {
        if (image.role === "background" && isTranslucent(image)) {
            // A tint, not a logo: the warnings below are about a picture drawn on a surface.
            return `, ${image.tone ? `${image.tone}, ` : ""}mostly see-through (about ${Math.round((image.opacity ?? 0) * 100)}% opaque) — the colour behind it shows through`;
        }
        if (!image.tone) {
            return "";
        }
        const base = `${image.tone}${image.transparent ? " on a transparent background" : ""}`;
        return image.tone === "light" && image.transparent
            ? `, ${base} — it is invisible on a light surface; keep it on the dark colour the section shows behind it`
            : image.tone === "dark" && image.transparent
              ? `, ${base} — keep it on a light surface`
              : `, ${base}`;
    };
    return [
        "",
        "The pictures in this section, largest first — the part each plays and the size it is drawn at:",
        ...images.map(
            image =>
                `- ${image.url}${image.alt ? ` (alt: "${image.alt}")` : ""} — ${role[image.role]}, ${image.width}x${image.height}px (${Math.round(image.coverage * 100)}% of the section)${tone(image)}`
        )
    ];
};

/**
 * The section's icon-font icons, by name.
 *
 * The page draws them with its own icon font, which the component will not have, so there is nothing
 * to copy — only what each icon is for. The model draws an equivalent as inline SVG, which is what it
 * would have to do for a hand-built component too.
 */
export const iconLines = (component: PlannedComponent): string[] => {
    const icons = component.icons ?? [];
    if (icons.length === 0) {
        return [];
    }
    return [
        "",
        "The section shows these icons, drawn on the page with an icon font this component will not",
        "have. Draw each as a simple inline SVG of that symbol, in the colour and size the crop shows,",
        "linked where a destination is given:",
        ...icons.map(icon => `- ${icon.label}${icon.href ? ` -> ${icon.href}` : ""}`)
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
/**
 * The section's background as regions, for a section with more than one (`backgroundRegions.ts`).
 *
 * Replaces the section-wide background facts rather than adding to them: the colour list's background
 * lines for the region colours, Plan's whole-section background binding and the section-wide image lines.
 * Told "the section's background is navy" and "the section's background is this pattern", the model put
 * both on one element. Replacing also means a wrong region fails visibly instead of being overridden by
 * a section-wide line.
 */
const regionLines = (component: PlannedComponent): string[] => {
    const regions = component.backgroundRegions;
    if (!regions || regions.length < 2) {
        return [];
    }
    const colour = (hex: string, token: { cssVariable: string } | null | undefined) =>
        token
            ? `var(${token.cssVariable}) (${hex})`
            : `${hex} (no theme variable expresses it; use it directly)`;
    const paint = (region: (typeof regions)[number]): string => {
        const p = region.paint;
        if (p.kind === "colour") {
            return `a solid ${colour(p.hex, p.token)}`;
        }
        const how = [p.size, p.position, p.repeat].filter(Boolean).join(" / ");
        if (isTranslucent(p)) {
            // The explanation the section-wide sentence carried (`tintLines`). Without it, "about 12%
            // opaque" read as an instruction: three of Take 3's four faded the already see-through file
            // again, with an 88% wash or `opacity: 0.12`.
            return `${
                p.under
                    ? `the colour ${colour(p.under.hex, p.under.token)}`
                    : "the colour the reference image shows through the image"
            }, with a mostly see-through image drawn over it (the file itself is about ${Math.round(
                (p.opacity ?? 0) * 100
            )}% opaque): the colour shows through it and is what the section looks like there. Set the image over the colour as a CSS background-image: ${p.url}${how ? ` — ${how}` : ""}`;
        }
        return `the image ${p.url}${how ? ` — ${how}` : ""}, as a CSS background-image`;
    };
    // An element is named by the text it holds, not by its captured box: given the box, the model drew a
    // box of that size, and the capture can be smaller than the source (`holdsOf`).
    const where = (region: (typeof regions)[number]): string => {
        const b = region.box;
        const whole = b.x <= 2 && b.y <= 2 && b.width >= 96 && b.height >= 96;
        const area = whole
            ? "the whole section"
            : region.holds
              ? `the element holding "${region.holds}"`
              : `${region.empty ? "an element with no content, at " : ""}x ${b.x}-${Math.min(100, b.x + b.width)}%, y ${b.y}-${Math.min(100, b.y + b.height)}% of the section`;
        return region.layer === 0 ? area : `on top of it, ${area}`;
    };
    return [
        "",
        `This section's background has ${regions.length} regions, listed bottom first. Paint each on the element`,
        "named, and do not put two of them on one element:",
        ...regions.map(region => `- ${where(region)}: ${paint(region)}`)
    ];
};

/** Colours the regions already describe, so the colour list does not state them section-wide again. */
const regionHexes = (component: PlannedComponent): string[] =>
    (component.backgroundRegions ?? []).flatMap(region =>
        region.paint.kind === "colour"
            ? [region.paint.hex]
            : region.paint.under
              ? [region.paint.under.hex]
              : []
    );

const nearHex = (a: string, b: string): boolean => {
    const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const [x, y] = [rgb(a), rgb(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 6;
};

const colourLines = (component: PlannedComponent): string[] => {
    const described = regionHexes(component);
    const colours = (component.representative?.resolvedColours ?? []).filter(
        colour => !(colour.role === "background" && described.some(hex => nearHex(hex, colour.hex)))
    );
    if (colours.length === 0) {
        return [];
    }
    return [
        "",
        "The colours this section measured, largest area first. Use the variable given for each:",
        ...colours.map(colour =>
            !colour.token
                ? `- ${colour.role} ${colour.hex} — no theme variable is near this colour, use ${colour.hex} directly`
                : crossesFamily(colour.role, colour.token.path)
                  ? `- ${colour.role} ${colour.hex} — the theme has this colour only as ${colour.token.path}, which is not a ${colour.role} colour; use ${colour.hex} directly`
                  : `- ${colour.role} ${colour.hex} — use var(${colour.token.cssVariable})`
        ),
        "",
        // "Do not write a hex value where a variable is given" was measured dead and removed
        // (ablation-result.md); it also contradicted this prompt's own "use the hex directly" lines.
        "Do not substitute a different theme colour for one listed here."
    ];
};

/**
 * The plan's type steps with a heading/body tie decided by the elements rather than manifest order.
 *
 * Applied here, where the theme manifest is at hand, so plans made before Plan recorded `headings`
 * get it too: the replay of #2 measured fresh output and missed that 7 of 8 stored plans predated the
 * fix. See `roleAwareTypeToken`.
 */
export const withRoleAwareTypeTokens = (
    planned: PlannedComponent,
    manifest: ThemeManifest
): PlannedComponent => {
    if (!planned.typeScale?.length) {
        return planned;
    }
    const roles = themeTypeRoles(manifest);
    return {
        ...planned,
        typeScale: planned.typeScale.map(step => ({
            ...step,
            token: roleAwareTypeToken(step, roles)
        }))
    };
};

/**
 * The plan's measured colours matched against the pinned theme now, not as Cluster recorded them.
 *
 * Applied beside `withRoleAwareTypeTokens` for the same reason: a matcher fix reaches stored plans only
 * where the theme manifest is at hand. Without it, Take 3's components would be regenerated from
 * Cluster's record — a grey header still told `feedback.info.background`.
 */
export const withRematchedColours = (
    planned: PlannedComponent,
    manifest: ThemeManifest
): PlannedComponent => {
    const colours = planned.representative?.resolvedColours;
    return {
        ...planned,
        ...(planned.representative && colours?.length
            ? {
                  representative: {
                      ...planned.representative,
                      resolvedColours: rematchColours(colours, manifest)
                  }
              }
            : {}),
        // The colour under a see-through image is a second stored binding; see rematchUnderImage.
        ...(planned.backgroundImages?.length
            ? {
                  backgroundImages: planned.backgroundImages.map(image =>
                      image.under
                          ? { ...image, under: rematchUnderImage(image.under, manifest) }
                          : image
                  )
              }
            : {})
    };
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
    feedback: string[] = [],
    ablate: Ablation = NO_ABLATION,
    include: Ablation = NO_ABLATION
): string => buildPrompt(component, slotVariables, feedback, ablate, include);

const buildPrompt = (
    component: PlannedComponent,
    slotVariables: Map<string, string[]>,
    feedback: string[] = [],
    ablate: Ablation = NO_ABLATION,
    // Candidate lines read it (`include.has(id)`): the quality instructions (OPT_IN_PROMPT_LINE_IDS).
    include: Ablation = NO_ABLATION
): string => {
    const attribute = createCopyAttribution(component);
    const propLines = (prop: PlannedComponent["props"][number], indent: string): string[] => {
        const decor = `${prop.array ? "[]" : ""}${prop.optional ? "?" : ""}`;
        /*
         * A prop's examples are the values this section has, not the ones only another copy shows: the
         * model builds its examples in. `observedValues` itself stays the union, for the readers that
         * rely on it.
         */
        const values = prop.observedValues.filter(value => attribute(value) !== "other");
        const elsewhere =
            prop.observedValues.length > 0 &&
            values.length === 0 &&
            ownStructuredValues(prop.observedStructured, attribute).length === 0;
        const sample = elsewhere
            ? " — this section shows no value for it: default it to empty and render nothing when it is empty"
            : values.length
              ? `: e.g. ${values.slice(0, 3).join(" | ")}`
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
        // The section's own values: they are what its reference image shows. Other copies' values
        // stay in the plan for the readers that need the union. See `ownStructuredValues`.
        for (const value of ownStructuredValues(prop.observedStructured, attribute)) {
            if (value.kind === "media") {
                lines.push(
                    `${indent}${prop.name}: ${value.src}${value.alt ? ` (alt: "${value.alt}")` : ""}`
                );
            } else if (value.kind === "link") {
                // A form's submit has a label and no destination; say so rather than print an empty arrow.
                lines.push(
                    `${indent}${prop.name}: "${value.label}" -> ${value.href || "(no destination: a form submit)"}`
                );
            } else {
                const fields = Object.entries(value.fields)
                    .map(([name, field]) =>
                        typeof field === "string"
                            ? `${name}: "${field}"`
                            : "label" in field
                              ? `${name}: "${field.label}" -> ${field.href || "(no destination)"}`
                              : `${name}: ${field.src}${field.alt ? ` (alt: "${field.alt}")` : ""}`
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
    // A binding that puts a text token on a background (or the reverse) is dropped, as the colour
    // list refuses the same mapping — otherwise the two lines would contradict each other.
    const regioned = (component.backgroundRegions?.length ?? 0) >= 2;
    const bindings = component.tokenBindings
        .filter(binding => !bindingCrossesFamily(binding))
        .filter(binding => !(regioned && bindingIsSectionBackground(binding)))
        .map(binding => {
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
                  // "Use ONLY these theme CSS variables ..." was measured dead once the prompt's
                  // vocabulary matched the validator's (line5-result.md); its apparent load in the
                  // first ablation was the mismatched lists.
                  "The theme's CSS variables:",
                  allowed
                      .slice(0, MAX_PROMPT_VARIABLES)
                      .map(name => `var(${name})`)
                      .join(", ")
              ]
            : []),
        ...colourLines(component),
        ...(regioned ? regionLines(component) : backgroundImageLines(component)),
        ...unboundImageLines(component),
        ...iconLines(component),
        ...typeScaleLines(component),
        ...headingLines(component),
        ...alignmentLines(component),
        ...layoutLines(component),
        ...spacingLines(component),
        ...imageFactLines(component),
        "",
        "Preserve this text content exactly:",
        ...textsToPreserve(component.sourceTexts)
            .slice(0, PRESERVED_TEXT_LIMIT)
            .map(text => `- ${text}`),
        ...qualityLines(component, include),
        ...(ablate.has("extraction.no-other-text")
            ? []
            : [
                  "",
                  "Show no other text. Do not add a heading, a button, a caption or a sentence the section does",
                  "not have — not even a plausible one. Where the crop shows only an image or a logo, the",
                  "component shows only that."
              ])
    ];

    const observed = component.props.flatMap(prop => structuredLines(prop, "- "));
    if (observed.length > 0) {
        lines.push(
            "",
            "These are the images and destinations the section itself used. Put them in the manifest's",
            "`defaults` as the default values for those inputs, exactly as given:",
            ...observed,
            // Replaced "Do NOT invent image URLs…": with it, 1 invented destination in 8 runs; with this, 0
            // in 8; with neither, 2 (a social link and a stock photograph). link-wording-result.md.
            ...(ablate.has("extraction.empty-destination")
                ? []
                : [
                      "",
                      "A link this section shows with no destination in the list above keeps an empty destination",
                      "(`\"\"`). Do not write one for it: not the site's home page, not a social network's home page."
                  ]),
            "",
            "An image is a `createFileInput`, and its value is an object, not a URL: its default is",
            '`{ url: "..." }`, and the component reads `.url` everywhere it uses it — `src={image.url}`,',
            "`url(${image.url})` in a style. That holds when the file input is a field inside an object:",
            "a `logo` object with a file field `src` is read as `logo.src.url`, never `logo.src`."
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
export type ReferenceImage = { fileId: string } | { failure: string };

/**
 * The reference image for the model: the section crop Segment already produced. Copied into a File
 * Manager record so the remote-components generation path can attach it. No cropping here — Segment is
 * the single place that reads the screenshot and derives crops.
 */
export const createReferenceImage = async (
    deps: Pick<GenerationDeps, "blobs" | "createFile" | "tenantContext">,
    input: Pick<GenerationInput, "runId" | "planned" | "log">
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
    const qualityIds = QUALITY_PROMPT_LINE_IDS.filter(id => (input.include ?? []).includes(id));
    let bestFailureCount = Number.POSITIVE_INFINITY;
    let previousFailures: string[] | null = null;
    let attempts = 0;

    // An install is one attempt: the output is fixed, so a second would only repeat the first.
    const maxAttempts = input.install ? 1 : MAX_ATTEMPTS;
    while (attempts < maxAttempts) {
        const budget = attemptBudget(Date.now(), input.deadline);
        if (!budget.proceed) {
            await input.log(
                `"${planned.name}": stopping after ${attempts} attempt(s) — too little time left for another.`
            );
            break;
        }
        attempts++;
        await input.beat(`"${planned.name}": generation attempt ${attempts}/${maxAttempts}…`);
        const feedback = previousFailures
            ? buildRetryFeedback(previousFailures, validVariables)
            : [];
        let trace: GenerationTrace | null = null;
        const install = input.install;
        const generated: Awaited<ReturnType<GenerateRemoteComponentUseCase.Interface["execute"]>> =
            install
                ? Result.ok({
                      source: install.source,
                      css: install.css,
                      name: planned.name,
                      label: planned.name,
                      description: "",
                      aiContext: ""
                  })
                : await deps.generateComponent.execute({
                      prompt: buildPrompt(
                          planned,
                          slotVariables,
                          feedback,
                          new Set(input.ablate ?? []),
                          new Set(input.include ?? [])
                      ),
                      name: planned.name,
                      ablate: [...SYSTEM_PROMPT_OVERRIDE, ...(input.ablate ?? [])],
                      effort: input.effort ?? GENERATION_EFFORT,
                      ...(input.systemOverride ?? {}),
                      additionalFileIds,
                      abortSignal: AbortSignal.timeout(budget.timeoutMs),
                      onTrace: recorded => {
                          trace = recorded;
                      }
                  });
        if (generated.isFail()) {
            await input.log(
                `Generate attempt ${attempts} failed for "${planned.name}": ${generated.error.message}`
            );
            await input.recordAttempt?.({
                attempt: attempts,
                maxAttempts,
                trace,
                outcome: "call-failed",
                failures: [generated.error.message]
            });
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
        let renderedMarkup = "";
        let renderedFiles: RenderedFile[] = [];
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
                const rendered = renderComponentMarkup(
                    bundled.bundled,
                    planned.name,
                    planned.props
                );
                renderedText = rendered.text;
                renderedMarkup = rendered.markup;
                renderedFiles = rendered.files;
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
            // The section's text is on the component, and no text the section does not show.
            textPreservation: combineValidation(
                validateTextPreservation(
                    textsToPreserve(planned.sourceTexts).slice(0, PRESERVED_TEXT_LIMIT),
                    renderedText,
                    renderedValues,
                    output.source
                ),
                validateNoInventedText(renderedMarkup, sourceTextPool(planned))
            ),
            // The declared props are used, and the values they carry render as values.
            contractConformance: combineValidation(
                validateContractConformance(
                    planned.props.map(prop => prop.name),
                    output.source
                ),
                combineValidation(
                    validateRenderedValues(renderedMarkup),
                    validateRenderedFiles(renderedMarkup, renderedFiles)
                )
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
            validation,
            // Which quality instructions this prompt carried, so a beta line can say where they ran.
            ...(qualityIds.length > 0 ? { qualityInstructions: qualityIds } : {})
        };
        await input.recordAttempt?.({
            attempt: attempts,
            maxAttempts,
            trace,
            outcome: failures.length === 0 ? "passed" : "failed-checks",
            failures,
            output: { source: output.source, css: output.css ?? "" }
        });
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

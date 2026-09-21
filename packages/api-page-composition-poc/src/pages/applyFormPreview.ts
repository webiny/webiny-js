import type { ComponentInput, ComponentManifest } from "@webiny/website-builder-sdk";

/**
 * What a migrated form says when someone submits it.
 *
 * Deliberately not a thank-you. The generated forms validate locally and then show their success
 * message, so with a plausible message in place a customer submits during a demo and believes their
 * enquiry was captured. Nothing is stored, sent or queued anywhere.
 */
export const FORM_PREVIEW_NOTICE =
    "Preview only — this form does not submit and nothing is stored.";

const TEXT_TYPES = new Set(["text", "longText", "lexical"]);

interface InputDefinition {
    name: string;
    type?: string;
    list?: boolean;
    fields?: InputDefinition[];
}

const asDefinition = (input: ComponentInput): InputDefinition =>
    input as unknown as InputDefinition;

/** The message a form shows once it believes it succeeded. */
const isSuccessMessage = (definition: InputDefinition): boolean =>
    !definition.list &&
    (definition.type === undefined || TEXT_TYPES.has(definition.type)) &&
    /(success|thank|confirm|submitted)/i.test(definition.name);

/** A submit control's own fields, which must not turn the button into a link. */
const isSubmitComposite = (definition: InputDefinition): boolean =>
    Array.isArray(definition.fields) && /submit/i.test(definition.name);

const isUrlField = (definition: InputDefinition): boolean =>
    definition.type === "url" || /(^|[^a-z])(url|href|link|to)([^a-z]|$)/i.test(definition.name);

/**
 * Makes a migrated form's inertness visible, and keeps it submittable.
 *
 * Two adjustments, both learned from the generated form this was built against:
 *
 * 1. Its success message has no default, so submitting validated the fields and then displayed
 *    nothing at all. Silent is what the brief rules out — the visitor cannot tell whether it worked.
 *    The message is forced to say what actually happened.
 *
 * 2. Its submit renders `submit.url ? <a href> : <button type="submit">`. Composite derivation is
 *    happy to fill that url from a link harvested off the page, which replaces the button with a
 *    link to somewhere else: the form then never submits at all and quietly navigates away. Any
 *    destination on a submit control is dropped so the button stays a button and the component's own
 *    inert handler runs.
 *
 * Applied only to components Classify called forms. A component that has no message input cannot be
 * given one from here — it will submit silently, which is a gap recorded in the README rather than
 * papered over.
 */
export const applyFormPreview = (params: {
    manifest: ComponentManifest;
    componentType: string;
    inputs: Record<string, unknown>;
}): Record<string, unknown> => {
    const { manifest, componentType, inputs } = params;

    if (componentType !== "form") {
        return inputs;
    }

    const adjusted: Record<string, unknown> = { ...inputs };

    for (const input of manifest.inputs ?? []) {
        const definition = asDefinition(input);

        if (isSuccessMessage(definition)) {
            adjusted[definition.name] = FORM_PREVIEW_NOTICE;
            continue;
        }

        if (isSubmitComposite(definition)) {
            const value = adjusted[definition.name];
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                continue;
            }
            const submit: Record<string, unknown> = { ...(value as Record<string, unknown>) };
            for (const field of definition.fields ?? []) {
                if (isUrlField(field)) {
                    delete submit[field.name];
                }
            }
            adjusted[definition.name] = submit;
        }
    }

    return adjusted;
};

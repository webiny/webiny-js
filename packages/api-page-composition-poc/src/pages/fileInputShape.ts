/**
 * How a generated component expects a file input's value to arrive.
 *
 * `createFileInput` is one input kind, but the components consuming it were generated under more than
 * one rule. Measured across the stored runs, of 43 file inputs: 35 read `.url` off the value, 3 pass
 * the value straight into `src={...}`, 4 do both and 1 is never consumed. The two are incompatible —
 * an object handed to a value-passer renders `<img src="[object Object]">`, a string handed to a
 * `.url` reader renders nothing at all — so no single shape serves the corpus.
 *
 * **The component's source is the authority on what its own input expects.** Reading that authority
 * is how a corpus generated under more than one rule is served correctly; it is not a workaround
 * around the generator, and it does not become unnecessary when the generator is fixed. A generation
 * fix converges FUTURE components only: everything generated before it lands still needs this check,
 * so it earns its place permanently. Do not remove it as a stopgap.
 */
export type FileInputShape = "object" | "string" | "unknown";

/** `x.name.url` or `name.url` — the value is treated as an object carrying a url. */
const readsUrl = (source: string, name: string): boolean =>
    new RegExp(`\\b${escape(name)}\\s*\\.\\s*url\\b`).test(source);

/**
 * `src={...name}` / `href={...name}` / `url(${...name})` — the value itself is treated as the string.
 * The trailing `}` or `||` matters: it separates passing the value from reading a property off it.
 */
const passesValue = (source: string, name: string): boolean =>
    new RegExp(
        `(src|href)=\\{\\s*[A-Za-z0-9_$.]*\\b${escape(name)}\\b\\s*(\\}|\\|\\|)` +
            `|url\\(\\$\\{[A-Za-z0-9_$.]*\\b${escape(name)}\\b\\}`
    ).test(source);

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every `createFileInput` in the component's source, mapped to the shape that component reads.
 *
 * A component that does both gets `object`: that is the shape the majority and the SDK's own
 * `normalizeToAsset` expect, so it is the side to be wrong on. One that does neither never renders
 * the input, so the shape cannot matter; it also gets `object` rather than a third state nobody
 * consumes.
 */
export const fileInputShapes = (source: string): Map<string, FileInputShape> => {
    const shapes = new Map<string, FileInputShape>();
    for (const match of source.matchAll(
        /\{\s*name:\s*"([^"]+)",\s*factory:\s*"createFileInput"/g
    )) {
        const name = match[1];
        const url = readsUrl(source, name);
        const passed = passesValue(source, name);

        /*
         * `unknown` is a real answer, not a gap to paper over.
         *
         * Neither direct form appears when a component assigns the value to a local first — measured,
         * 18 of 147 file inputs across the corpus do that, and 16 of those pass it through a
         * normaliser the model wrote itself (`resolveUrl`, `fileUrl`, `mediaUrl`) which accepts either
         * shape. A local can contain arbitrary JavaScript, so scanning will never settle those; what
         * it can do is decline to pretend it knows.
         *
         * A component doing BOTH is `object`: that is the shape the majority read and the one the
         * SDK's own `normalizeToAsset` expects, so it is the side to be wrong on.
         */
        shapes.set(name, url ? "object" : passed ? "string" : "unknown");
    }
    return shapes;
};

/** The inputs whose shape could not be read from the source, for reporting rather than guessing. */
export const unresolvedFileInputs = (shapes: ReadonlyMap<string, FileInputShape>): string[] =>
    [...shapes.entries()].filter(([, shape]) => shape === "unknown").map(([name]) => name);

/**
 * The value to bind for one captured image, in the shape this component reads.
 *
 * `unknown` binds the object form, and the choice is evidence-led rather than arbitrary: 66% of file
 * inputs read `.url` directly, and the normalisers that most unresolved cases route through accept
 * either shape. It is still a fallback, which is why every one is recorded in the discard log — the
 * two measured cases it gets wrong are components that render a raw member access, and naming them is
 * what turns a silent 12% misclassification into a reported condition.
 *
 * A value that satisfied both shapes at once was considered and rejected. A `String` object carrying a
 * `url` property does satisfy every observed pattern, by exploiting coercion — and that is what makes
 * it wrong: `typeof` would report "object", identity comparisons would differ, and any component doing
 * `JSON.stringify`, `Object.keys` or a `typeof` check would behave in a way nobody predicted, with the
 * symptom surfacing somewhere else entirely. A value whose shape is deliberately ambiguous is the
 * problem this project keeps hitting, not the answer to it.
 */
export const fileInputValue = (src: string, shape: FileInputShape): string | { url: string } =>
    shape === "string" ? src : { url: src };

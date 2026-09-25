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
export type FileInputShape = "object" | "string";

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
        shapes.set(
            name,
            !readsUrl(source, name) && passesValue(source, name) ? "string" : "object"
        );
    }
    return shapes;
};

/** The value to bind for one captured image, in the shape this component reads. */
export const fileInputValue = (src: string, shape: FileInputShape): string | { url: string } =>
    shape === "string" ? src : { url: src };

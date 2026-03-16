import type {
    CssProperties,
    DocumentElement,
    ComponentManifestInput
} from "@webiny/website-builder-sdk";

export type ComponentProps<TInputs = unknown> = {
    inputs: TInputs;
    styles: CssProperties;
    element: DocumentElement;
    breakpoint: string;
};

export type ComponentPropsWithChildren<TInputs = unknown> = ComponentProps<
    TInputs & { children: React.ReactNode }
>;

export type ExtractInputs<T> = T extends { inputs: infer I } ? I : never;

export type ExtractInputNames<T extends (props: any) => any> = keyof ExtractInputs<
    Parameters<T>[0]
>;

/**
 * Infer the full typed ComponentManifestInput from a React component.
 *
 * @example
 * ```ts
 * import type { InferManifest } from "@webiny/website-builder-nextjs";
 * import type { Funnel } from "./Funnel.js";
 *
 * type FunnelManifest = InferManifest<typeof Funnel>;
 *
 * // Use indexed access for callback types:
 * const handler: FunnelManifest["onDescendantChange"] = ctx => {
 *     ctx.inputs.registry; // fully typed
 * };
 * ```
 */
export type InferManifest<T extends (props: any) => any> = ComponentManifestInput<
    ExtractInputs<Parameters<T>[0]>
>;

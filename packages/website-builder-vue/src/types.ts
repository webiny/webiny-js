import type {
    CssProperties,
    DocumentElement,
    ComponentManifestInput,
    ComponentChangeHandler,
    DescendantChangeHandler
} from "@webiny/website-builder-sdk";
import type { VNode } from "vue";

/**
 * Props received by every user-defined component registered via createComponent().
 */
export type ComponentProps<TInputs = unknown> = {
    inputs: TInputs;
    styles: CssProperties;
    element: DocumentElement;
    breakpoint: string;
};

/**
 * Shorthand for components that accept children (Box, Root, GridColumn, etc.).
 * `inputs.children` is the resolved VNode produced by ElementSlot.
 */
export type ComponentPropsWithChildren<TInputs = unknown> = ComponentProps<
    TInputs & { children: VNode | null }
>;

// ---------- TypeScript utility types (mirrors the React package) ----------

export type ExtractInputs<T> = T extends { inputs: infer I } ? I : never;

export type ExtractInputNames<T extends (props: any) => any> = keyof ExtractInputs<
    Parameters<T>[0]
>;

export type InferManifest<T extends (props: any) => any> = ComponentManifestInput<
    ExtractInputs<Parameters<T>[0]>
>;

export type InferComponentChange<T extends (props: any) => any> = ComponentChangeHandler<
    ExtractInputs<Parameters<T>[0]>
>;

export type InferDescendantChange<T extends (props: any) => any> = DescendantChangeHandler<
    ExtractInputs<Parameters<T>[0]>
>;

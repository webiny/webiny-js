import { useEffect, useState } from "react";
import type React from "react";
import type { IFieldVM } from "~/features/formModel/abstractions.js";
import { bundleRenderer } from "./bundleRenderer.js";
import { createRendererRuntime, loadRenderer } from "./rendererRuntime.js";

type RendererComponent = React.ComponentType<{ field: IFieldVM }>;

export interface GeneratedRendererState {
    component: RendererComponent | null;
    error: string | null;
    loading: boolean;
}

/**
 * Bundle and evaluate one stored renderer.
 *
 * Both halves can fail on input nobody checked: the source came from a model, and the only thing
 * standing between it and a blank admin screen is this returning an error instead of throwing. So a
 * failure is a value here, not an exception, and the caller decides what to show.
 *
 * Keyed on `source` rather than on a component id, so editing a renderer re-bundles it and swapping
 * two renderers around does not hand back the previous one's component.
 */
export const useGeneratedRenderer = (source: string): GeneratedRendererState => {
    const [state, setState] = useState<GeneratedRendererState>({
        component: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        let cancelled = false;
        setState({ component: null, error: null, loading: true });

        bundleRenderer(source)
            .then(({ bundled }) => {
                const component = loadRenderer(bundled, createRendererRuntime());
                if (!cancelled) {
                    setState({ component, error: null, loading: false });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    const error = err instanceof Error ? err.message : String(err);
                    setState({ component: null, error, loading: false });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [source]);

    return state;
};

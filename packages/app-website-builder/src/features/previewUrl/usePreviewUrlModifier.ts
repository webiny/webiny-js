import { useMemo } from "react";
import { useContainer } from "@webiny/app-admin";
import { PreviewUrlModifier } from "./abstractions.js";

/**
 * Every registered modifier, applied in registration order (each sees the previous ones' changes),
 * or null when none is registered. Before, only the first one ran, so a second extension's
 * modifier (PAC's, after the `previewUrlModifier` example) never applied.
 */
export const usePreviewUrlModifier = (): PreviewUrlModifier.Interface | null => {
    const container = useContainer();
    return useMemo(() => {
        const modifiers = container.resolveAll(PreviewUrlModifier);
        if (modifiers.length === 0) {
            return null;
        }
        return {
            async modify(url: URL) {
                for (const modifier of modifiers) {
                    await modifier.modify(url);
                }
            }
        };
    }, [container]);
};

import React, { useMemo } from "react";
import { resolveDocument, type TokenPath } from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

/**
 * The handful of slots that best characterise a theme at a glance. Deliberately semantic rather
 * than the first N primitives: two themes can share a palette and still look nothing alike.
 */
const PREVIEW_SLOTS: TokenPath[] = [
    "color.surface.page",
    "color.text.primary",
    "color.action.primary.background",
    "color.feedback.success.foreground",
    "color.feedback.danger.foreground"
];

interface PaletteStripProps {
    theme: ThemeDto;
}

/** Makes the list scannable visually rather than by name alone. */
export const PaletteStrip = ({ theme }: PaletteStripProps) => {
    const colors = useMemo(() => {
        // A published theme has a frozen snapshot; a draft has to be resolved on the spot.
        if (theme.resolved) {
            const byPath = new Map(theme.resolved.modes.light.map(token => [token.path, token]));
            return PREVIEW_SLOTS.map(path => byPath.get(path)?.value);
        }

        const resolved = resolveDocument(theme.tokens);
        return PREVIEW_SLOTS.map(path => resolved.tokens.get(path)?.value);
    }, [theme]);

    return (
        <div className="flex gap-xs">
            {colors.map((color, index) => (
                <Swatch
                    key={PREVIEW_SLOTS[index]}
                    color={typeof color === "string" ? color : undefined}
                />
            ))}
        </div>
    );
};

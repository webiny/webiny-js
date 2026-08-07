import React, { useMemo } from "react";
import { resolveDocument, type TokenPath } from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

/**
 * The handful of slots that best characterise a theme at a glance. Deliberately semantic rather
 * than the first N primitives: two themes can share a palette and still look nothing alike.
 *
 * These are the identity-bearing slots — the page, its text and the brand's action/link colours.
 * The feedback slots (success/danger) are deliberately excluded: they resolve to roughly the same
 * green and red in almost every theme, so they made every strip look alike rather than distinct.
 */
const PREVIEW_SLOTS: TokenPath[] = [
    "color.surface.page",
    "color.text.primary",
    "color.action.primary.background",
    "color.action.secondary.background",
    "color.text.link"
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

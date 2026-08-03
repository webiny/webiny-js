import React, { useMemo } from "react";
import { ColorPicker, TokenColorPicker, type TokenSwatchGroup } from "@webiny/admin-ui";
import type { ThemeMode, TokenPath } from "@webiny/theme-common";
import { useActiveTheme } from "./ActiveThemeProvider.js";

export interface ThemeColorSelection {
    /** Set when the user picked a theme swatch. */
    path: TokenPath | null;
    /** The resolved colour. Always set — for a token this is what it resolves to right now. */
    value: string;
}

export interface ThemeColorPickerProps {
    /** Current literal value, whether it came from a token or was typed. */
    value?: string;
    /** Path of the token currently applied, if any, so the picker can mark it when reopened. */
    tokenPath?: TokenPath | null;
    onChange: (selection: ThemeColorSelection) => void;
    mode?: ThemeMode;
    disabled?: boolean;
}

/**
 * The colour picker every consumer should use.
 *
 * It turns the active theme into swatches, applies the theme's policy to decide whether a free
 * value is offered, and reports back either a token path or a plain colour. With no active theme it
 * falls back to today's open behaviour — that is the guarantee section 9 makes to projects that
 * never adopt a theme.
 */
export const ThemeColorPicker = ({
    value,
    tokenPath,
    onChange,
    mode = "light",
    disabled
}: ThemeColorPickerProps) => {
    const { loaded, snapshot, policy, colorSwatches } = useActiveTheme();

    const groups = useMemo<TokenSwatchGroup[]>(() => {
        const swatches = colorSwatches(mode);
        const byGroup = new Map<string, TokenSwatchGroup>();

        for (const swatch of swatches) {
            const group = byGroup.get(swatch.groupLabel) ?? {
                label: swatch.groupLabel,
                swatches: []
            };
            group.swatches.push({ id: swatch.path, label: swatch.label, value: swatch.value });
            byGroup.set(swatch.groupLabel, group);
        }

        return [...byGroup.values()];
    }, [colorSwatches, mode]);

    // Until the theme has loaded, and on projects with none, behave exactly as before: a plain
    // colour input. Rendering a constrained picker first and relaxing it a moment later would be
    // worse than never constraining at all.
    if (!loaded || !snapshot) {
        return (
            <ColorPicker
                value={value}
                disabled={disabled}
                size="md"
                onChangeComplete={next => onChange({ path: null, value: next })}
            />
        );
    }

    return (
        <TokenColorPicker
            groups={groups}
            allowFreeValue={policy.color.entry !== "theme-only"}
            value={value}
            selectedId={tokenPath ?? null}
            disabled={disabled}
            onSelectSwatch={swatch => onChange({ path: swatch.id, value: swatch.value })}
            onSelectValue={next => onChange({ path: null, value: next })}
            constrainedNote="Colours are set by the active theme."
        />
    );
};

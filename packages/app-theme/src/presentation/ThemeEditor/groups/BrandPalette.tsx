import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { ColorPicker, Separator, Text } from "@webiny/admin-ui";
import type { ThemeMode, TokenPath } from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";

interface BrandPaletteProps {
    primitives: Array<{ path: TokenPath; name: string }>;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

/**
 * The raw palette, collapsed by default.
 *
 * Semantic slots are what most people touch; the palette is for whoever set the theme up. Putting
 * both on equal footing would make the brand owner scroll past eleven hex codes to reach the two
 * rows they came for — see the design brief, section 12.
 */
export const BrandPalette = observer(function BrandPalette({
    primitives,
    resolved,
    mode,
    readOnly
}: BrandPaletteProps) {
    const [open, setOpen] = useState(false);
    const themes = useThemes();

    const preview = primitives.slice(0, 4);

    return (
        <div className="flex-none border-t border-neutral-dimmed bg-neutral-subtle">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="w-full flex items-center gap-sm px-md py-sm text-left"
                aria-expanded={open}
            >
                <Text size="md" className="font-semibold">
                    Brand palette
                </Text>
                <Text
                    size="sm"
                    className="text-neutral-strong"
                >{`${primitives.length} ${primitives.length === 1 ? "colour" : "colours"}`}</Text>
                {open ? null : (
                    <span className="ml-auto flex gap-[3px]">
                        {preview.map(primitive => {
                            const value = resolved.value(primitive.path, mode);
                            return (
                                <Swatch
                                    key={primitive.path}
                                    size="sm"
                                    color={typeof value === "string" ? value : undefined}
                                />
                            );
                        })}
                    </span>
                )}
            </button>

            {open ? (
                <>
                    <Separator />
                    <div className="max-h-[240px] overflow-y-auto px-md py-sm flex flex-col">
                        {primitives.map(primitive => {
                            const value = resolved.value(primitive.path, mode);
                            const literal = typeof value === "string" ? value : undefined;

                            return (
                                <div
                                    key={primitive.path}
                                    className="flex items-center gap-sm py-xs"
                                >
                                    {readOnly ? (
                                        <Swatch color={literal} />
                                    ) : (
                                        <ColorPicker
                                            value={literal ?? "#000000"}
                                            size="md"
                                            onChangeComplete={next =>
                                                themes.setTokenValue(primitive.path, mode, next)
                                            }
                                        />
                                    )}
                                    <Text size="md" className="flex-1 truncate">
                                        {primitive.name}
                                    </Text>
                                    <Text
                                        size="sm"
                                        className="flex-none font-mono text-neutral-strong"
                                    >
                                        {literal ?? "—"}
                                    </Text>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : null}
        </div>
    );
});

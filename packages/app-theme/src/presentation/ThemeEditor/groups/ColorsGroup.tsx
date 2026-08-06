import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { IconButton, Text, TokenColorPicker, Tooltip } from "@webiny/admin-ui";
import type { TokenSwatch } from "@webiny/admin-ui";
import { ReactComponent as UnlinkIcon } from "@webiny/icons/link_off.svg";
import {
    CANONICAL_COLOR_SLOTS,
    collectTokens,
    META_EXTENSION,
    toCssVariableName,
    type ThemeMode,
    type TokenPath
} from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import { TokenValueBadge } from "~/presentation/components/TokenValueBadge.js";
import { WarningMarker, WarningNote } from "~/presentation/components/InlineWarning.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import { useThemes } from "~/presentation/useThemes.js";
import { BrandPalette } from "./BrandPalette.js";
import { sortByColor } from "./colorSort.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { InfoCard } from "./_shared.js";

interface ColorsGroupProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

interface SlotRowProps extends ColorsGroupProps {
    path: TokenPath;
    label: string;
    brandSwatches: TokenSwatch[];
}

/**
 * One semantic slot. Its picker offers the brand palette as swatches, so choosing one *links* the
 * slot to that brand color; choosing "Any color" sets a one-off literal. The row states plainly
 * which of the two it is, and offers to break a link.
 */
const SlotRow = observer(function SlotRow({
    resolved,
    mode,
    readOnly,
    path,
    label,
    brandSwatches
}: SlotRowProps) {
    const themes = useThemes();

    const value = resolved.value(path, mode);
    const literal = typeof value === "string" ? value : undefined;
    const reference = resolved.reference(path, mode);
    const warnings = resolved.contrastWarnings.get(path)?.filter(w => w.mode === mode) ?? [];

    return (
        <div>
            <div className="flex items-center gap-sm py-xs">
                {readOnly ? (
                    <Swatch color={literal} />
                ) : (
                    <TokenColorPicker
                        groups={[{ label: "Brand palette", swatches: brandSwatches }]}
                        value={literal ?? "#000000"}
                        selectedId={reference?.path ?? null}
                        disabled={readOnly}
                        onSelectSwatch={swatch => themes.setTokenReference(path, mode, swatch.id)}
                        onSelectValue={next => themes.setTokenValue(path, mode, next)}
                    />
                )}

                <div className="flex flex-1 min-w-0 flex-col gap-0">
                    <div className="flex items-center gap-xs">
                        <Text size="md" className="truncate leading-tight">
                            {label}
                        </Text>
                        {warnings.length > 0 ? <WarningMarker /> : null}
                    </div>
                    <Text
                        as="span"
                        size="sm"
                        className="truncate font-mono text-neutral-dimmed leading-tight"
                    >
                        {toCssVariableName(path)}
                    </Text>
                </div>

                <TokenValueBadge
                    reference={reference?.name ?? null}
                    referencePath={reference?.path}
                    literal={literal}
                />

                {reference && !readOnly ? (
                    // Breaking the link freezes the color it currently resolves to as a literal.
                    <Tooltip
                        content="Unlink from the brand palette"
                        rawTrigger={true}
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="sm"
                                icon={<UnlinkIcon />}
                                aria-label="Unlink from the brand palette"
                                onClick={() =>
                                    themes.setTokenValue(path, mode, literal ?? "#000000")
                                }
                            />
                        }
                    />
                ) : null}
            </div>

            {warnings.map(warning => (
                <WarningNote
                    key={`${warning.pair.background}-${warning.mode}`}
                    message={warning.message}
                    className="mt-xs mb-xs"
                />
            ))}
        </div>
    );
});

/**
 * Colors — the core screen.
 *
 * Two ideas, made explicit: the **brand palette** is your raw brand colors (the source of truth),
 * and the **slots** are where color is used. A slot links to a brand color — so rebranding is
 * editing one palette entry — or holds a one-off custom value. The old screen showed both but never
 * the relationship; now every slot's picker offers the palette inline, and the link is stated per row.
 */
export const ColorsGroup = observer(function ColorsGroup(props: ColorsGroupProps) {
    const { theme, resolved, mode } = props;

    const groups = useMemo(() => {
        const byGroup = new Map<string, { label: string; slots: typeof CANONICAL_COLOR_SLOTS }>();
        for (const slot of CANONICAL_COLOR_SLOTS) {
            const existing = byGroup.get(slot.group);
            if (existing) {
                (existing.slots as unknown as (typeof slot)[]).push(slot);
            } else {
                byGroup.set(slot.group, { label: slot.groupLabel, slots: [slot] as never });
            }
        }
        return [...byGroup.values()];
    }, []);

    const primitives = useMemo(() => {
        return [...collectTokens(theme.tokens).values()]
            .filter(visited => visited.path.startsWith("color.brand."))
            .map(visited => ({
                path: visited.path,
                name:
                    visited.token.$extensions?.[META_EXTENSION]?.displayName ??
                    visited.path.split(".").pop()!
            }));
    }, [theme.tokens]);

    // The palette as swatches every slot's picker can link to — ordered by color (greys, then by
    // hue) so the popover reads the same way the brand palette does. Per mode, since a token can
    // resolve to a different color in dark.
    const brandSwatches: TokenSwatch[] = useMemo(() => {
        return sortByColor(primitives, primitive => resolved.value(primitive.path, mode)).map(
            primitive => {
                const value = resolved.value(primitive.path, mode);
                return {
                    id: primitive.path,
                    label: primitive.name,
                    value: typeof value === "string" ? value : "#000000"
                };
            }
        );
    }, [primitives, resolved, mode]);

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-md">
            <BrandPalette primitives={primitives} {...props} />

            {groups.map(group => (
                <InfoCard key={group.label} title={group.label}>
                    <div className="flex flex-col">
                        {group.slots.map(slot => (
                            <SlotRow
                                key={slot.path}
                                {...props}
                                path={slot.path}
                                label={slot.label}
                                brandSwatches={brandSwatches}
                            />
                        ))}
                    </div>
                </InfoCard>
            ))}
        </div>
    );
});

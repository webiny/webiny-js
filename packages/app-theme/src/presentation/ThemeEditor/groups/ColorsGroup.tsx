import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ColorPicker, Text } from "@webiny/admin-ui";
import {
    CANONICAL_COLOR_SLOTS,
    META_EXTENSION,
    collectTokens,
    type ThemeMode,
    type TokenPath
} from "@webiny/theme-common";
import { Swatch } from "~/presentation/components/Swatch.js";
import { TokenValueBadge } from "~/presentation/components/TokenValueBadge.js";
import { WarningMarker, WarningNote } from "~/presentation/components/InlineWarning.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import { useThemes } from "~/presentation/useThemes.js";
import { BrandPalette } from "./BrandPalette.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

interface ColorsGroupProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

interface SlotRowProps extends ColorsGroupProps {
    path: TokenPath;
    label: string;
}

const SlotRow = observer(function SlotRow({ resolved, mode, readOnly, path, label }: SlotRowProps) {
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
                    <ColorPicker
                        value={literal ?? "#000000"}
                        size="md"
                        onChangeComplete={next => themes.setTokenValue(path, mode, next)}
                    />
                )}
                <div className="flex flex-1 min-w-0 items-center gap-xs">
                    <Text size="md" className="truncate">
                        {label}
                    </Text>
                    {warnings.length > 0 ? <WarningMarker /> : null}
                </div>
                <TokenValueBadge
                    reference={reference?.name ?? null}
                    referencePath={reference?.path}
                    literal={literal}
                />
            </div>
            {warnings.map(warning => (
                <WarningNote
                    key={`${warning.pair.background}-${warning.mode}`}
                    message={warning.message}
                />
            ))}
        </div>
    );
});

/**
 * The core screen. Semantic slots grouped under the headings the schema declares, with the brand
 * palette collapsed underneath — two levels of depth in one interface, with the second
 * de-emphasised, as the design brief requires.
 */
export const ColorsGroup = observer(function ColorsGroup(props: ColorsGroupProps) {
    const { theme } = props;

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

    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-md">
                {groups.map(group => (
                    <div key={group.label}>
                        <Text
                            size="sm"
                            className="block uppercase tracking-wide font-semibold text-neutral-strong mb-xs"
                        >
                            {group.label}
                        </Text>
                        {group.slots.map(slot => (
                            <SlotRow
                                key={slot.path}
                                {...props}
                                path={slot.path}
                                label={slot.label}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <BrandPalette primitives={primitives} {...props} />
        </>
    );
});

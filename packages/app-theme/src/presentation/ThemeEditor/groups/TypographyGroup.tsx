import React from "react";
import { observer } from "mobx-react-lite";
import { Input, Select, Separator, Text } from "@webiny/admin-ui";
import {
    CANONICAL_TYPOGRAPHY_ROLES,
    getTokenAtPath,
    isTypographyValue,
    parseAlias,
    splitPath,
    TEXT_STEPS,
    toAlias,
    type ThemeMode
} from "@webiny/theme-common";
import { useThemes } from "~/presentation/useThemes.js";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { RampGroup } from "./RampGroup.js";

interface TypographyGroupProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <Text size="sm" className="block uppercase tracking-wide font-semibold text-neutral-strong">
        {children}
    </Text>
);

/**
 * Fonts in use. Google Fonts only in v1, and only the weights the theme actually references are
 * requested — that list is what the SDK turns into the link and preload hints in the head.
 */
const Fonts = observer(function Fonts({ theme }: { theme: ThemeDto }) {
    return (
        <div className="flex flex-col gap-xs">
            <SectionHeading>Fonts</SectionHeading>
            {theme.settings.fonts.map(font => (
                <div key={font.key} className="flex items-baseline gap-sm py-xs">
                    <Text size="md" className="flex-1" style={{ fontFamily: font.family }}>
                        {font.family}
                    </Text>
                    <Text size="sm" className="flex-none font-mono text-neutral-strong">
                        {font.weights.join(", ")}
                    </Text>
                </div>
            ))}
            <Text size="sm" className="block text-neutral-strong">
                Changing fonts is not built yet — the defaults ship with the theme.
            </Text>
        </div>
    );
});

/**
 * The two controls that produce the ramp. Changing either regenerates every step; individual steps
 * can be overridden afterwards, and regenerating discards those overrides on purpose.
 */
const RampGenerator = observer(function RampGenerator({
    theme,
    readOnly
}: {
    theme: ThemeDto;
    readOnly: boolean;
}) {
    const themes = useThemes();
    const config = theme.settings.ramps.text;

    const update = (end: "min" | "max", key: "base" | "ratio", raw: string) => {
        const parsed = Number.parseFloat(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return;
        }

        themes.regenerateRamp("text", {
            ...config,
            [end]: { ...config[end], [key]: parsed },
            // Regenerating is the explicit "start over" action.
            overrides: undefined
        });
    };

    return (
        <div className="flex flex-col gap-xs">
            <SectionHeading>Scale</SectionHeading>
            <div className="grid grid-cols-2 gap-sm">
                <Input
                    label="Base size (small screens)"
                    value={String(config.min.base)}
                    disabled={readOnly}
                    onChange={value => update("min", "base", value)}
                />
                <Input
                    label="Ratio (small screens)"
                    value={String(config.min.ratio)}
                    disabled={readOnly}
                    onChange={value => update("min", "ratio", value)}
                />
                <Input
                    label="Base size (large screens)"
                    value={String(config.max.base)}
                    disabled={readOnly}
                    onChange={value => update("max", "base", value)}
                />
                <Input
                    label="Ratio (large screens)"
                    value={String(config.max.ratio)}
                    disabled={readOnly}
                    onChange={value => update("max", "ratio", value)}
                />
            </div>
            <Text size="sm" className="block text-neutral-strong">
                Sizes are in rem. Changing any of these regenerates the whole ramp and clears
                per-step edits.
            </Text>
        </div>
    );
});

/** A role: which ramp step it uses, plus its own weight and line height. */
const RoleRow = observer(function RoleRow({
    theme,
    path,
    label,
    readOnly
}: {
    theme: ThemeDto;
    path: string;
    label: string;
    readOnly: boolean;
}) {
    const themes = useThemes();

    const token = getTokenAtPath(theme.tokens, path);
    const value = token && isTypographyValue(token.$value) ? token.$value : undefined;

    if (!value) {
        return null;
    }

    const sizeTarget = parseAlias(value.fontSize);
    const sizeStep = sizeTarget ? splitPath(sizeTarget).pop() : undefined;

    return (
        <div className="flex items-end gap-sm py-xs">
            <Text size="md" className="flex-1 min-w-0 truncate">
                {label}
            </Text>

            <Select
                value={sizeStep ?? ""}
                disabled={readOnly}
                placeholder="Size"
                options={TEXT_STEPS.map(step => ({ label: step, value: step }))}
                onChange={(step: string) =>
                    themes.setTypography(path, "fontSize", toAlias(`text.${step}`))
                }
            />

            <Input
                value={String(value.fontWeight)}
                disabled={readOnly}
                onChange={raw => {
                    const parsed = Number.parseInt(raw, 10);
                    if (Number.isFinite(parsed)) {
                        themes.setTypography(path, "fontWeight", parsed);
                    }
                }}
            />

            <Input
                value={String(value.lineHeight)}
                disabled={readOnly}
                onChange={raw => {
                    const parsed = Number.parseFloat(raw);
                    if (Number.isFinite(parsed)) {
                        themes.setTypography(path, "lineHeight", parsed);
                    }
                }}
            />
        </div>
    );
});

/**
 * Typography — see the design brief, screen 6.
 *
 * Fonts, then the generator that produces the ramp, then the ramp itself, then the roles that point
 * at it. That order matters: the roles are what most people touch, but they only make sense once
 * you can see what they are pointing at.
 */
export const TypographyGroup = observer(function TypographyGroup(props: TypographyGroupProps) {
    const { theme, readOnly } = props;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-md">
            <Fonts theme={theme} />
            <Separator />
            <RampGenerator theme={theme} readOnly={readOnly} />
            <Separator />

            <div className="flex flex-col">
                <SectionHeading>Size ramp</SectionHeading>
                {/* The ramp editor is shared with spacing; it brings its own scroll container, so
                    it is rendered unconstrained here inside this one. */}
                <div className="-mx-md">
                    <RampGroup rampId="text" {...props} />
                </div>
            </div>

            <Separator />

            <div className="flex flex-col">
                <SectionHeading>Roles</SectionHeading>
                <div className="flex items-end gap-sm pb-xs pt-sm">
                    <Text size="sm" className="flex-1 text-neutral-strong">
                        Role
                    </Text>
                    <Text size="sm" className="w-[120px] flex-none text-neutral-strong">
                        Size
                    </Text>
                    <Text size="sm" className="w-[80px] flex-none text-neutral-strong">
                        Weight
                    </Text>
                    <Text size="sm" className="w-[80px] flex-none text-neutral-strong">
                        Line height
                    </Text>
                </div>
                {CANONICAL_TYPOGRAPHY_ROLES.map(role => (
                    <RoleRow
                        key={role.path}
                        theme={theme}
                        path={role.path}
                        label={role.label}
                        readOnly={readOnly}
                    />
                ))}
            </div>
        </div>
    );
});

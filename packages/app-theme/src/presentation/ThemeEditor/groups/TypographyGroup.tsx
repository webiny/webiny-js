import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { AutoComplete, Button, cn, Dialog, Input, Select, Text } from "@webiny/admin-ui";
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
import { RampEditor } from "./RampEditor.js";
import { GOOGLE_FONTS } from "./googleFonts.js";
import { InfoCard } from "./_shared.js";

interface TypographyGroupProps {
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}

type Role = (typeof CANONICAL_TYPOGRAPHY_ROLES)[number];
type FontDef = ThemeDto["settings"]["fonts"][number];

/** What each shipped font is for — derived from its key, which is stable. */
const FONT_PURPOSE: Record<string, string> = {
    sans: "Interface and body",
    mono: "Code"
};

/** Explains roles — on the "Roles" box. */
const ROLES_INFO = (
    <>
        <Text size="md" as="div" className="block text-neutral-primary leading-snug">
            A role is a named text style your content uses — Body, Lead, Heading 1, and so on. Each
            role points at a size on the ramp and sets its own weight and line height.
        </Text>
        <Text size="md" as="div" className="block text-neutral-primary leading-snug">
            Editing a role changes every place that uses it — change Body once and all body copy
            follows. Click a role to edit its size, weight and line height.
        </Text>
    </>
);

/** A curated shortlist of Google Fonts for quick picking; any family name still works via the input. */
const POPULAR_FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Work Sans",
    "Source Sans 3",
    "Nunito",
    "Merriweather",
    "Playfair Display",
    "IBM Plex Sans",
    "IBM Plex Mono",
    "JetBrains Mono",
    "Fira Code",
    "Space Grotesk"
];

const GOOGLE_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Loads a Google Fonts family into the document so the specimen renders in the real face while
 * picking. Debounced so typing does not fire a request per keystroke; each family is loaded once and
 * left in place, since switching back should be instant.
 */
const useGoogleFontPreview = (family: string): void => {
    useEffect(() => {
        const name = family.trim();
        if (!name || typeof document === "undefined") {
            return;
        }
        const id = `wby-font-preview-${name.toLowerCase()}`;
        const timer = window.setTimeout(() => {
            if (document.getElementById(id)) {
                return;
            }
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, "+")}&display=swap`;
            document.head.appendChild(link);
        }, 400);
        return () => window.clearTimeout(timer);
    }, [family]);
};

const chipClass = (selected: boolean): string =>
    cn(
        "rounded-sm border px-sm py-xs text-sm cursor-pointer transition-colors",
        selected
            ? "border-accent-default bg-accent-subtle text-accent-primary"
            : "border-neutral-dimmed text-neutral-strong hover:bg-neutral-light"
    );

/**
 * Edits one font: its Google Fonts family and the weights to load. The family is picked from the full
 * Google Fonts catalogue via a searchable list (or a quick-pick chip); the specimen renders in the
 * chosen family, loaded on the fly. Weights toggle immediately.
 */
const FontEditDialog = observer(function FontEditDialog({
    theme,
    fontKey,
    readOnly,
    onClose
}: {
    theme: ThemeDto;
    fontKey: string;
    readOnly: boolean;
    onClose: () => void;
}) {
    const themes = useThemes();
    const font = theme.settings.fonts.find(item => item.key === fontKey);
    const [query, setQuery] = useState("");

    useGoogleFontPreview(font?.family ?? "");

    // The full Google Fonts list is ~2000 long, so filter to the search and cap the rendered set;
    // always keep the current family selectable even when a search would filter it out.
    const options = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matches = (
            q ? GOOGLE_FONTS.filter(name => name.toLowerCase().includes(q)) : GOOGLE_FONTS
        ).slice(0, 60);
        const current = font?.family;
        const withCurrent = current && !matches.includes(current) ? [current, ...matches] : matches;
        return withCurrent.map(name => ({ label: name, value: name }));
    }, [query, font?.family]);

    if (!font) {
        return null;
    }

    const pickFamily = (value: string) => {
        if (value) {
            themes.setFont(font.key, { family: value });
        }
    };

    const toggleWeight = (weight: number) => {
        const next = font.weights.includes(weight)
            ? font.weights.filter(w => w !== weight)
            : [...font.weights, weight].sort((a, b) => a - b);
        // A font must load at least one weight.
        if (next.length > 0) {
            themes.setFont(font.key, { weights: next });
        }
    };

    return (
        <Dialog
            open={true}
            onOpenChange={next => (next ? undefined : onClose())}
            title={FONT_PURPOSE[font.key] ?? "Font"}
            description="Pick a Google Fonts family and the weights to load."
            actions={<Button variant="primary" onClick={onClose} text="Done" />}
        >
            <div className="flex flex-col gap-md">
                <div
                    className="rounded-sm bg-neutral-light px-sm py-md flex flex-col gap-sm"
                    style={{ fontFamily: font.family }}
                >
                    <span style={{ fontSize: "26px", lineHeight: 1.2 }}>The quick brown fox</span>
                    <span
                        className="text-neutral-strong"
                        style={{ fontSize: "15px", lineHeight: 1.5 }}
                    >
                        Jumps over the lazy dog · 0123456789
                    </span>
                </div>

                <AutoComplete
                    label="Family"
                    value={font.family}
                    options={options}
                    disabled={readOnly}
                    placeholder="Search Google Fonts…"
                    emptyMessage="No matching font"
                    onValueSearch={setQuery}
                    onValueChange={pickFamily}
                />

                <div className="flex flex-col gap-xs">
                    <Text size="sm" className="block font-medium">
                        Popular
                    </Text>
                    <div className="flex flex-wrap gap-xs">
                        {POPULAR_FONTS.map(name => (
                            <button
                                key={name}
                                type="button"
                                disabled={readOnly}
                                onClick={() => pickFamily(name)}
                                className={chipClass(name === font.family)}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-xs">
                    <Text size="sm" className="block font-medium">
                        Weights
                    </Text>
                    <div className="flex flex-wrap gap-xs">
                        {GOOGLE_WEIGHTS.map(weight => (
                            <button
                                key={weight}
                                type="button"
                                disabled={readOnly}
                                onClick={() => toggleWeight(weight)}
                                className={cn(
                                    "font-mono",
                                    chipClass(font.weights.includes(weight))
                                )}
                            >
                                {weight}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Dialog>
    );
});

const sizeStepOf = (value: { fontSize: unknown }): string | undefined => {
    const target = parseAlias(value.fontSize);
    return target ? splitPath(target).pop() : undefined;
};

/** The font key a role points at (`font.sans` → `sans`), or undefined when it holds a literal. */
const fontKeyOf = (value: { fontFamily: unknown }): string | undefined => {
    const target = parseAlias(value.fontFamily);
    return target ? splitPath(target).pop() : undefined;
};

const familyForKey = (theme: ThemeDto, key: string | undefined): string | undefined =>
    key ? theme.settings.fonts.find(font => font.key === key)?.family : undefined;

/** The card body — shared by the read-only and editable renderings of a font. */
const FontCardBody = ({ font }: { font: FontDef }) => (
    <>
        <div className="flex-1 min-w-0">
            <Text
                size="md"
                as="div"
                className="truncate font-semibold"
                style={{ fontFamily: font.family }}
            >
                {font.family}
            </Text>
            <Text size="sm" as="div" className="truncate text-neutral-strong">
                {`${FONT_PURPOSE[font.key] ?? "Text"} · Google Fonts`}
            </Text>
        </div>
        <div className="flex flex-none items-center gap-xs">
            {font.weights.map(weight => (
                <span
                    key={weight}
                    className="rounded-sm bg-neutral-light px-xs py-[2px] font-mono text-sm text-neutral-strong"
                >
                    {weight}
                </span>
            ))}
        </div>
    </>
);

/** The fonts in play. A row opens an editor for its family and weights. Google Fonts only in v1. */
const Fonts = observer(function Fonts({ theme, readOnly }: { theme: ThemeDto; readOnly: boolean }) {
    const [editingKey, setEditingKey] = useState<string | null>(null);

    return (
        <InfoCard title="Fonts">
            <div className="flex flex-col divide-y divide-neutral-dimmed">
                {theme.settings.fonts.map(font =>
                    readOnly ? (
                        <div key={font.key} className="flex items-center gap-sm px-sm py-sm">
                            <FontCardBody font={font} />
                        </div>
                    ) : (
                        <button
                            key={font.key}
                            type="button"
                            onClick={() => setEditingKey(font.key)}
                            className="flex items-center gap-sm rounded-sm px-sm py-sm text-left cursor-pointer hover:bg-neutral-light"
                        >
                            <FontCardBody font={font} />
                        </button>
                    )
                )}
            </div>

            {editingKey ? (
                <FontEditDialog
                    theme={theme}
                    fontKey={editingKey}
                    readOnly={readOnly}
                    onClose={() => setEditingKey(null)}
                />
            ) : null}
        </InfoCard>
    );
});

/** One row of the roles table. The whole row is the edit trigger, unless the version is read-only. */
const RoleRow = observer(function RoleRow({
    theme,
    role,
    onEdit
}: {
    theme: ThemeDto;
    role: Role;
    onEdit: (() => void) | null;
}) {
    const token = getTokenAtPath(theme.tokens, role.path);
    const value = token && isTypographyValue(token.$value) ? token.$value : undefined;
    if (!value) {
        return null;
    }

    const cells = (
        <>
            <Text size="md" className="flex-1 min-w-0 truncate">
                {role.label}
            </Text>
            <Text size="sm" className="w-[80px] flex-none truncate text-neutral-strong">
                {familyForKey(theme, fontKeyOf(value)) ?? "—"}
            </Text>
            <Text size="sm" className="w-[40px] flex-none font-mono text-neutral-strong">
                {sizeStepOf(value) ?? "—"}
            </Text>
            <Text size="sm" className="w-[44px] flex-none font-mono text-neutral-strong">
                {String(value.fontWeight)}
            </Text>
            <Text size="sm" className="w-[40px] flex-none font-mono text-neutral-strong">
                {String(value.lineHeight)}
            </Text>
        </>
    );

    if (!onEdit) {
        return <div className="flex items-center gap-sm px-sm py-sm">{cells}</div>;
    }

    return (
        <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-sm rounded-sm px-sm py-sm text-left transition-colors cursor-pointer hover:bg-neutral-light"
        >
            {cells}
        </button>
    );
});

/**
 * A role's editor, in a modal so the list stays a compact, scannable table. The specimen renders the
 * weight and leading live (the web font is not loaded in the editor, so the family is named, not
 * rendered).
 */
const RoleEditDialog = observer(function RoleEditDialog({
    theme,
    role,
    readOnly,
    onClose
}: {
    theme: ThemeDto;
    role: Role;
    readOnly: boolean;
    onClose: () => void;
}) {
    const themes = useThemes();

    const token = getTokenAtPath(theme.tokens, role.path);
    const value = token && isTypographyValue(token.$value) ? token.$value : undefined;

    const fontKey = value ? fontKeyOf(value) : undefined;
    const family = familyForKey(theme, fontKey);
    useGoogleFontPreview(family ?? "");

    const specimenStyle: React.CSSProperties = {
        fontFamily: family,
        fontWeight: typeof value?.fontWeight === "number" ? value.fontWeight : undefined,
        lineHeight: typeof value?.lineHeight === "number" ? value.lineHeight : undefined
    };

    return (
        <Dialog
            open={true}
            onOpenChange={next => (next ? undefined : onClose())}
            title={role.label}
            description="Pick a size from the scale, then set this style's own weight and line height."
            actions={<Button variant="primary" onClick={onClose} text="Done" />}
        >
            {value ? (
                <div className="flex flex-col gap-md">
                    <div className="rounded-sm bg-neutral-light px-sm py-md">
                        <Text
                            size="lg"
                            as="div"
                            className="text-neutral-strong"
                            style={specimenStyle}
                        >
                            The quick brown fox jumps over the lazy dog
                        </Text>
                    </div>

                    <div className="flex flex-col gap-xs">
                        <Text size="sm" className="block font-medium">
                            Font
                        </Text>
                        <Select
                            value={fontKey ?? ""}
                            disabled={readOnly}
                            placeholder="Font"
                            options={theme.settings.fonts.map(font => ({
                                label: font.family || font.key,
                                value: font.key
                            }))}
                            onChange={(key: string) =>
                                themes.setTypography(
                                    role.path,
                                    "fontFamily",
                                    toAlias(`font.${key}`)
                                )
                            }
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-sm">
                        <div className="flex flex-col gap-xs">
                            <Text size="sm" className="block font-medium">
                                Size
                            </Text>
                            <Select
                                value={sizeStepOf(value) ?? ""}
                                disabled={readOnly}
                                placeholder="Size"
                                options={TEXT_STEPS.map(step => ({ label: step, value: step }))}
                                onChange={(step: string) =>
                                    themes.setTypography(
                                        role.path,
                                        "fontSize",
                                        toAlias(`text.${step}`)
                                    )
                                }
                            />
                        </div>
                        <Input
                            label="Weight"
                            value={String(value.fontWeight)}
                            disabled={readOnly}
                            onChange={raw => {
                                const parsed = Number.parseInt(raw, 10);
                                if (Number.isFinite(parsed)) {
                                    themes.setTypography(role.path, "fontWeight", parsed);
                                }
                            }}
                        />
                        <Input
                            label="Leading"
                            value={String(value.lineHeight)}
                            disabled={readOnly}
                            onChange={raw => {
                                const parsed = Number.parseFloat(raw);
                                if (Number.isFinite(parsed)) {
                                    themes.setTypography(role.path, "lineHeight", parsed);
                                }
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
});

/** The roles as a compact table; a row opens the editor. */
const Roles = observer(function Roles({ theme, readOnly }: { theme: ThemeDto; readOnly: boolean }) {
    const [editing, setEditing] = useState<Role | null>(null);

    return (
        <InfoCard
            title="Roles"
            hint={`${CANONICAL_TYPOGRAPHY_ROLES.length} roles`}
            info={ROLES_INFO}
        >
            <div className="flex items-center gap-sm px-sm pb-xs">
                <Text size="sm" className="flex-1 uppercase tracking-wide text-neutral-dimmed">
                    Role
                </Text>
                <Text
                    size="sm"
                    className="w-[80px] flex-none uppercase tracking-wide text-neutral-dimmed"
                >
                    Font
                </Text>
                <Text
                    size="sm"
                    className="w-[40px] flex-none uppercase tracking-wide text-neutral-dimmed"
                >
                    Step
                </Text>
                <Text
                    size="sm"
                    className="w-[44px] flex-none uppercase tracking-wide text-neutral-dimmed"
                >
                    Wght
                </Text>
                <Text
                    size="sm"
                    className="w-[40px] flex-none uppercase tracking-wide text-neutral-dimmed"
                >
                    Line
                </Text>
            </div>

            <div className="flex flex-col divide-y divide-neutral-dimmed">
                {CANONICAL_TYPOGRAPHY_ROLES.map(role => (
                    <RoleRow
                        key={role.path}
                        theme={theme}
                        role={role}
                        onEdit={readOnly ? null : () => setEditing(role)}
                    />
                ))}
            </div>

            {editing ? (
                <RoleEditDialog
                    theme={theme}
                    role={editing}
                    readOnly={readOnly}
                    onClose={() => setEditing(null)}
                />
            ) : null}
        </InfoCard>
    );
});

/**
 * Typography — see the design brief, screen 6.
 *
 * Reads top-down like the design: the fonts in play, the size ramp they scale on, then the roles that
 * pick a step off that ramp. Roles are a compact table rather than a wall of inputs — a row opens a
 * small editor — so the whole system is scannable at a glance.
 */
export const TypographyGroup = observer(function TypographyGroup(props: TypographyGroupProps) {
    const { theme, readOnly } = props;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-md">
            <Fonts theme={theme} readOnly={readOnly} />
            <RampEditor rampId="text" {...props} />
            <Roles theme={theme} readOnly={readOnly} />
        </div>
    );
});

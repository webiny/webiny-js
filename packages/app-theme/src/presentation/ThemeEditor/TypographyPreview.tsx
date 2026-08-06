import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Separator } from "@webiny/admin-ui";
import {
    CANONICAL_TYPOGRAPHY_ROLES,
    getTokenAtPath,
    isTypographyValue,
    META_EXTENSION,
    parseAlias,
    splitPath,
    TEXT_STEPS
} from "@webiny/theme-common";
import type { ThemeDto } from "~/features/themeGateway/index.js";

/** A line of sample copy per size step, largest to smallest, so the scale reads as real content. */
const STEP_SAMPLE: Record<string, string> = {
    "3xl": "Every lane, one timeline",
    "2xl": "Built for freight operations",
    xl: "Carrier performance",
    lg: "Route density and dwell time",
    md: "The workhorse size for body copy",
    sm: "Secondary text, table cells, form labels",
    xs: "Meta information and captions",
    "2xs": "Legal lines and tags",
    "3xs": "Fine print and micro labels"
};

/** Sample copy per role, chosen so each reads as the kind of content it is meant for. */
const ROLE_SAMPLE_TEXT: Record<string, string> = {
    "type.heading.1": "Every lane, one timeline",
    "type.heading.2": "Built for freight operations",
    "type.heading.3": "Carrier performance",
    "type.heading.4": "Route density and dwell time",
    "type.heading.5": "Operational summary",
    "type.heading.6": "Section label",
    "type.lead":
        "Northbeam gives operations teams a shared view of every shipment, from booking to proof of delivery.",
    "type.body":
        "When a lane runs late, the people who need to know find out at the same time. Dispatchers see the delay on the board, the account manager sees it on the customer record, and the customer sees a revised window on their portal.",
    "type.bodySmall": "Secondary text, table cells and form labels use this smaller body size.",
    "type.caption": "Figures shown are for the Rotterdam–Malmö corridor, Q1 2026.",
    "type.code": "GET /v2/shipments?lane=402&status=in_transit"
};

/** Headings first (H1→H6), then the text roles — how a page actually reads, not canonical order. */
const ROLE_ORDER = [
    "type.heading.1",
    "type.heading.2",
    "type.heading.3",
    "type.heading.4",
    "type.heading.5",
    "type.heading.6",
    "type.lead",
    "type.body",
    "type.bodySmall",
    "type.caption",
    "type.code"
];

const roleLabel = (path: string): string =>
    CANONICAL_TYPOGRAPHY_ROLES.find(role => role.path === path)?.label ?? path;

/** The roles to render, in reading order, skipping any the theme does not define. */
const previewRoles = ROLE_ORDER.filter(path =>
    CANONICAL_TYPOGRAPHY_ROLES.some(role => role.path === path)
);

/** A step's rendered size: the fluid maximum (desktop) when it scales, otherwise its plain value. */
const sizeForStep = (theme: ThemeDto, step: string): string => {
    const token = getTokenAtPath(theme.tokens, `text.${step}`);
    const fluid = token?.$extensions?.[META_EXTENSION]?.fluid;
    if (fluid?.enabled && typeof fluid.max === "string") {
        return fluid.max;
    }
    return typeof token?.$value === "string" ? token.$value : "16px";
};

const familyForKey = (theme: ThemeDto, key: string | undefined): string | undefined =>
    key ? theme.settings.fonts.find(font => font.key === key)?.family : undefined;

/** Resolves a role's typography into inline styles: size (via its ramp step), weight, leading, family. */
const roleStyle = (theme: ThemeDto, path: string): React.CSSProperties => {
    const token = getTokenAtPath(theme.tokens, path);
    if (!token || !isTypographyValue(token.$value)) {
        return {};
    }
    const value = token.$value;

    const sizeTarget = parseAlias(value.fontSize);
    const step = sizeTarget ? splitPath(sizeTarget).pop() : undefined;
    const familyTarget = parseAlias(value.fontFamily);
    const familyKey = familyTarget ? splitPath(familyTarget).pop() : undefined;

    return {
        fontSize: step ? sizeForStep(theme, step) : undefined,
        fontWeight: typeof value.fontWeight === "number" ? value.fontWeight : undefined,
        lineHeight: typeof value.lineHeight === "number" ? value.lineHeight : undefined,
        fontFamily: familyForKey(theme, familyKey)
    };
};

/** Loads the theme's Google Fonts so the specimen renders in the real faces. Loaded once each. */
const useThemeFonts = (families: string[]): void => {
    const key = families.join(",");
    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }
        for (const family of families) {
            const name = family.trim();
            if (!name) {
                continue;
            }
            const id = `wby-font-load-${name.toLowerCase()}`;
            if (document.getElementById(id)) {
                continue;
            }
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${name.replace(
                /\s+/g,
                "+"
            )}:wght@300;400;500;600;700&display=swap`;
            document.head.appendChild(link);
        }
        // Families are the only input; joined so the effect re-runs when the set changes.
    }, [key]);
};

/**
 * A live type specimen — the theme's own sizes, weights, leading and fonts rendered as real content.
 * The size ramp reads top-down largest to smallest; the roles below show body copy exactly as it will
 * set. Shown in the preview column only while the Typography group is open.
 */
export const TypographyPreview = observer(function TypographyPreview({
    theme
}: {
    theme: ThemeDto;
}) {
    useThemeFonts(theme.settings.fonts.map(font => font.family));
    const sansFamily = familyForKey(theme, "sans");

    return (
        <div className="flex-1 min-h-0 overflow-auto p-lg">
            <div className="mx-auto max-w-[760px] rounded-lg bg-neutral-base p-xl flex flex-col gap-lg">
                <div className="flex flex-col gap-md">
                    {[...TEXT_STEPS].reverse().map(step => (
                        <div key={step} className="flex items-baseline gap-md">
                            <span className="w-8 flex-none font-mono text-sm text-neutral-dimmed">
                                {step}
                            </span>
                            <span
                                className="min-w-0 truncate text-neutral-primary"
                                style={{
                                    fontSize: sizeForStep(theme, step),
                                    fontFamily: sansFamily,
                                    lineHeight: 1.15
                                }}
                            >
                                {STEP_SAMPLE[step] ?? "The quick brown fox"}
                            </span>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="flex flex-col gap-lg">
                    {previewRoles.map(path => {
                        const text =
                            ROLE_SAMPLE_TEXT[path] ?? "The quick brown fox jumps over the lazy dog";
                        return (
                            <div key={path} className="flex flex-col gap-xs">
                                <span className="font-mono text-sm text-neutral-dimmed">
                                    {roleLabel(path)}
                                </span>
                                {path === "type.code" ? (
                                    <pre
                                        className="rounded-sm bg-neutral-light px-sm py-sm text-neutral-primary overflow-x-auto"
                                        style={roleStyle(theme, path)}
                                    >
                                        {text}
                                    </pre>
                                ) : (
                                    <div
                                        className="text-neutral-primary"
                                        style={roleStyle(theme, path)}
                                    >
                                        {text}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

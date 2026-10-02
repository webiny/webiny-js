import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, TypeScaleEntry } from "~/domain/artifacts.js";

/**
 * The type scale a section actually used, expressed in the theme's vocabulary where it has one.
 *
 * Measured on both sides, a generated component's type is systematically small: max font size has a
 * median ratio of 0.77 against its source section and is smaller on 21 of 31 components, with heading
 * errors reaching -44px. The mechanism is sharper than a bias — 15 of 31 renders put their largest
 * type between 31px and 34px, 13 of them at exactly 33px, behind source headings from 31px to 60px.
 * The model is not scaling the section's type. It is writing a house heading of about 2rem whatever
 * the section did, because nothing ever told it what the section did.
 *
 * `fontSize` and `lineHeight` are captured on every node and read by nothing — the same shape as the
 * image values: measured, carried one stage, dropped.
 *
 * Per section rather than per prop, deliberately. Attaching a size to each text prop would need props
 * mapped to source nodes, which is the alignment problem that put 52 props across four sites in the
 * wrong slot and took a rewrite to contain. A scale says which sizes exist and how common each is;
 * the model already knows which of its own props is the heading, and cannot misattribute a scale.
 */

/** Sizes within this of each other are the same step — a page rounds 19.5px and 20px to one intent. */
const SAME_SIZE_PX = 1;

/**
 * How near a theme role must be to count as the way to express a measured size.
 *
 * Generous rather than strict: the point is to reach for the theme first, and a heading two percent
 * off is still the heading. What this must NOT do is match anything to the nearest role regardless of
 * distance — a 60px source heading silently bound to a 33px `type.h1` is exactly the failure being
 * fixed, wearing a token.
 */
const NEAR_TOKEN = (measured: number): number => Math.max(1.5, measured * 0.1);

const px = (value: unknown): number | null => {
    if (typeof value === "number") {
        return value > 0 ? value : null;
    }
    if (typeof value !== "string") {
        return null;
    }
    const match = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
    if (!match) {
        return null;
    }
    const n = parseFloat(match[1]);
    if (!isFinite(n) || n <= 0) {
        return null;
    }
    // rem/em against the 16px root the capture ran at; a unitless number is already px.
    return match[2] === "rem" || match[2] === "em" ? n * 16 : n;
};

interface ThemeTypeRole {
    path: string;
    cssVariable: string;
    fontSize: number;
}

/**
 * The theme's typography roles with their resolved sizes.
 *
 * A role is a composite — family, size, weight, line height, letter spacing — and contributes several
 * CSS variables. The one that carries the size is the one a component needs to reference, so it is
 * preferred by name and the first variable is the fallback for a theme that names them differently.
 */
export const themeTypeRoles = (manifest: ThemeManifest): ThemeTypeRole[] => {
    const roles: ThemeTypeRole[] = [];
    for (const slot of manifest.slots) {
        const value = slot.values?.light as { fontSize?: unknown } | undefined;
        const size = value && typeof value === "object" ? px(value.fontSize) : null;
        if (size === null) {
            continue;
        }
        const variables = slot.cssVariables ?? [];
        const sized = variables.find(name => /font-?size/i.test(name)) ?? variables[0];
        if (!sized) {
            continue;
        }
        roles.push({ path: String(slot.path), cssVariable: sized, fontSize: size });
    }
    return roles;
};

const nearestRole = (size: number, roles: ThemeTypeRole[]): ThemeTypeRole | null => {
    let best: ThemeTypeRole | null = null;
    let bestDistance = Infinity;
    for (const role of roles) {
        const distance = Math.abs(role.fontSize - size);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = role;
        }
    }
    return best && bestDistance <= NEAR_TOKEN(size) ? best : null;
};

/**
 * Every distinct type size the section's text-bearing elements use, largest first.
 *
 * Text-bearing means a node with direct non-empty text and a non-zero box — the same definition the
 * render-side measurement uses, so the two are comparable. A wrapper's inherited size is not a
 * decision the page made about type.
 */
export const sectionTypeScale = (
    node: CapturedNode,
    manifest: ThemeManifest | null
): TypeScaleEntry[] => {
    const roles = manifest ? themeTypeRoles(manifest) : [];
    const seen: { fontSize: number; lineHeight: number | null; elements: number }[] = [];

    const walk = (current: CapturedNode): void => {
        const runs = current.textRuns ?? (current.text ? [current.text] : []);
        const text = runs.join(" ").replace(/\s+/g, " ").trim();
        const box = current.box;
        const size = px(current.styles?.fontSize);
        if (text && box && box.width > 0 && box.height > 0 && size !== null) {
            const lineHeight = px(current.styles?.lineHeight);
            const existing = seen.find(entry => Math.abs(entry.fontSize - size) <= SAME_SIZE_PX);
            if (existing) {
                existing.elements++;
                if (existing.lineHeight === null) {
                    existing.lineHeight = lineHeight;
                }
            } else {
                seen.push({ fontSize: size, lineHeight, elements: 1 });
            }
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);

    return seen
        .sort((a, b) => b.fontSize - a.fontSize)
        .map(entry => {
            const role = nearestRole(entry.fontSize, roles);
            return {
                fontSize: Math.round(entry.fontSize * 10) / 10,
                lineHeight:
                    entry.lineHeight === null ? null : Math.round(entry.lineHeight * 10) / 10,
                elements: entry.elements,
                token: role
                    ? {
                          path: role.path,
                          cssVariable: role.cssVariable,
                          fontSize: Math.round(role.fontSize * 10) / 10
                      }
                    : null
            };
        });
};

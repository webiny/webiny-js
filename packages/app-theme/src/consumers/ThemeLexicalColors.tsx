import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { TEXT_STEPS, toCssVariableName } from "@webiny/theme-common";
import { useActiveTheme } from "./ActiveThemeProvider.js";

const { LexicalTheme } = AdminConfig;

/**
 * Publishes the active theme's canonical colour slots to the rich-text toolbar, and tells it whether
 * a free colour is allowed.
 *
 * This is the per-selection half of the rich-text story from the Theme design brief, section 7.3.
 * Structural styling (paragraphs, headings, quotes, code, lists) is handled by Lexical's class-name
 * map and needs no per-node data; only an author colouring a phrase stores anything, and what it
 * stores is a token path.
 *
 * With no active theme nothing is registered, so the toolbar keeps offering whatever the project
 * configured itself — which is the section 9 guarantee.
 */
export const ThemeLexicalColors = () => {
    const { loaded, snapshot, policy, colorSwatches } = useActiveTheme();

    if (!loaded || !snapshot) {
        return null;
    }

    const allowedSteps = policy.fontSize.allowedSteps;

    return (
        <>
            <LexicalTheme.AllowCustomColor value={policy.color.entry !== "theme-only"} />

            {colorSwatches("light").map(swatch => (
                <LexicalTheme.Color
                    key={swatch.path}
                    // The id IS the token path: it is what gets stored on the node, and what the
                    // renderer turns back into a CSS variable.
                    id={swatch.path}
                    label={`${swatch.groupLabel} · ${swatch.label}`}
                    value={swatch.value}
                />
            ))}

            {TEXT_STEPS.filter(step => allowedSteps === null || allowedSteps.includes(step)).map(
                step => (
                    <LexicalTheme.FontSize
                        key={step}
                        id={step}
                        label={step}
                        // A variable rather than the resolved length: a size picked here follows the
                        // theme, including its fluid clamp(), instead of freezing at today's value.
                        value={`var(${toCssVariableName(`text.${step}`)})`}
                    />
                )
            )}
        </>
    );
};

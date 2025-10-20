import fs from "fs";
import { DEFAULTS } from "./defaults.js";

// We don't need tokens that end with `-a{one or two numbers}` because they are used for
// alpha colors. We don't need these because we can use the /alpha function in Tailwind CSS.
const isColorWithAlpha = variantName => {
    return variantName.match(/^.*-a\d{1,2}$/);
};

const createThemeCssV4 = (normalizedFigmaExport, normalizedPrimitivesFigmaExport) => {
    // Generate `theme.css` file for Tailwind v4.
    let themeCss = fs.readFileSync(
        new URL("./templates/theme-v4.css.txt", import.meta.url),
        "utf8"
    );

    // ===== @theme block - Tailwind v4 utility definitions =====

    // // 1. THEME: Font sizes
    // {
    //     const fontSizes = normalizedFigmaExport
    //         .filter(item => item.type === "textFont" && item.variantName.startsWith("font-size-"))
    //         .sort((a, b) => a.resolvedValue - b.resolvedValue)
    //         .map(({ variantName, resolvedValue }) => {
    //             const size = variantName.replace("font-size-", "");
    //             return `--text-${size}: ${resolvedValue}px;`;
    //         });
    //
    //     // Add heading sizes
    //     const headingSizes = [1, 2, 3, 4, 5, 6].map(lvl => {
    //         return `--text-h${lvl}: var(--text-h${lvl});`;
    //     });
    //
    //     themeCss = themeCss.replace(
    //         "{THEME_FONT_SIZES}",
    //         [...headingSizes, ...fontSizes].join("\n  ")
    //     );
    // }
    //
    // // 2. THEME: Border radius
    // {
    //     const borderRadius = normalizedFigmaExport
    //         .filter(item => item.type === "borderRadius")
    //         .map(variable => {
    //             return `--radius-${variable.variantName}: ${variable.resolvedValue}px;`;
    //         });
    //
    //     themeCss = themeCss.replace("{THEME_BORDER_RADIUS}", borderRadius.join("\n  "));
    // }
    //
    // 3. THEME: Spacing
    {
        const spacing = normalizedFigmaExport
            .filter(item => item.type === "spacing")
            .map(variable => {
                return `--spacing-${variable.variantName}: ${variable.resolvedValue}px;`;
            });

        themeCss = themeCss.replace("{THEME_SPACING}", spacing.join("\n  "));
    }

    // 4. THEME: Colors - Map all color types to --color-* for Tailwind utilities
    {
        const colorMap = new Map();

        // Collect all color variants from different types
        // "textColor", "borderColor", "fill", "ringColor"
        normalizedFigmaExport
            .filter(item => item.type === "backgroundColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .forEach(variable => {
                const colorKey = variable.variantName.replace("-default", "");
                if (!colorMap.has(colorKey)) {
                    colorMap.set(colorKey, `--color-${colorKey}: var(--color-${colorKey});`);
                }
            });

        normalizedFigmaExport
            .filter(item => item.type === "textColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .forEach(variable => {
                const colorKey = variable.variantName.replace("-default", "");
                if (!colorMap.has('tc-' +colorKey)) {
                    colorMap.set('tc-' +colorKey, `--text-color-${colorKey}: var(--text-color-${colorKey});`);
                }
            });

        const colors = Array.from(colorMap.values());
        themeCss = themeCss.replace("{THEME_COLORS}", colors.join("\n  "));
    }

    // // 5. THEME: Ring width - Map to ring-* utilities
    // {
    //     const ringWidths = normalizedFigmaExport
    //         .filter(item => item.type === "ringWidth")
    //         .map(variable => {
    //             return `--ring-${variable.variantName}: ${variable.resolvedValue}px;`;
    //         });
    //
    //     themeCss = themeCss.replace("{THEME_RING_WIDTH}", ringWidths.join("\n  "));
    // }

    // ===== :root block - CSS custom properties (same as v3) =====

    // 0. Colors (primitives)
    {
        let currentBgColorGroup = null;
        const bgColors = normalizedPrimitivesFigmaExport
            .filter(item => item.type === "colors")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--color-${variable.variantName}: ${variable.hsla.h} ${variable.hsla.s}% ${variable.hsla.l}%;`;

                if (!currentBgColorGroup) {
                    currentBgColorGroup = colorGroup;
                    return cssVar;
                }

                if (!currentBgColorGroup || currentBgColorGroup !== colorGroup) {
                    currentBgColorGroup = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat()
            .reverse();

        themeCss = themeCss.replace("{COLORS}", bgColors.join("\n    "));
    }

    // 1. Background color
    {
        let currentBgColorGroup = null;
        const bgColors = normalizedFigmaExport
            .filter(item => item.type === "backgroundColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
                const cssVar = `--color-${variable.variantName.replace("-default", "")}: hsl(var(--${cssVarName}));`;

                if (!currentBgColorGroup) {
                    currentBgColorGroup = colorGroup;
                    return cssVar;
                }

                if (!currentBgColorGroup || currentBgColorGroup !== colorGroup) {
                    currentBgColorGroup = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        themeCss = themeCss.replace("{BACKGROUND_COLOR}", bgColors.join("\n    "));
    }

    // // 2. Border color
    // {
    //     let currentBorderColor = null;
    //     const borderColors = normalizedFigmaExport
    //         .filter(item => item.type === "borderColor")
    //         .filter(variable => !isColorWithAlpha(variable.variantName))
    //         .map(variable => {
    //             const [colorGroup] = variable.variantName.split("-");
    //             const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
    //             const cssVar = `--border-${variable.variantName}: var(--${cssVarName});`;
    //
    //             if (!currentBorderColor) {
    //                 currentBorderColor = colorGroup;
    //                 return cssVar;
    //             }
    //
    //             if (!currentBorderColor || currentBorderColor !== colorGroup) {
    //                 currentBorderColor = colorGroup;
    //                 return ["", cssVar];
    //             }
    //             return cssVar;
    //         })
    //         .flat();
    //
    //     themeCss = themeCss.replace("{BORDER_COLOR}", borderColors.join("\n    "));
    // }
    //
    // // 3. Border radius
    // {
    //     const borderRadius = normalizedFigmaExport
    //         .filter(item => item.type === "borderRadius")
    //         .map(variable => {
    //             return `--radius-${variable.variantName}: ${variable.resolvedValue}px;`;
    //         });
    //
    //     themeCss = themeCss.replace("{BORDER_RADIUS}", borderRadius.join("\n    "));
    // }
    //
    // 4. Border width
    {
        const borderWidth = normalizedFigmaExport
            .filter(item => item.type === "borderWidth")
            .map(
                variable => `--border-width-${variable.variantName}: ${variable.resolvedValue}px;`
            );

        themeCss = themeCss.replace("{BORDER_WIDTH}", borderWidth.join("\n    "));
    }
    //
    // // 5. Fill
    // {
    //     let currentFillColorGroup = null;
    //     const fillColors = normalizedFigmaExport
    //         .filter(item => item.type === "fill")
    //         .filter(variable => !isColorWithAlpha(variable.variantName))
    //         .map(variable => {
    //             const [colorGroup] = variable.variantName.split("-");
    //             const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
    //             const cssVar = `--fill-${variable.variantName}: var(--${cssVarName});`;
    //
    //             if (!currentFillColorGroup) {
    //                 currentFillColorGroup = colorGroup;
    //                 return cssVar;
    //             }
    //
    //             if (!currentFillColorGroup || currentFillColorGroup !== colorGroup) {
    //                 currentFillColorGroup = colorGroup;
    //                 return ["", cssVar];
    //             }
    //             return cssVar;
    //         })
    //         .flat();
    //
    //     themeCss = themeCss.replace("{FILL}", fillColors.join("\n    "));
    // }
    //
    // // 6. Font
    // {
    //     themeCss = themeCss.replace("{FONT}", `--font-sans: 'Inter', sans-serif;`);
    // }
    //
    // // 7. Font weight
    // {
    //     const weight = normalizedFigmaExport
    //         .filter(item => item.type === "textFont" && item.variantName.startsWith("font-weight-"))
    //         .map(variable => `--${variable.variantName}: ${variable.resolvedValue};`);
    //
    //     themeCss = themeCss.replace("{FONT_WEIGHT}", weight.join("\n    "));
    // }
    //
    // // 8. Margin
    // {
    //     const margin = normalizedFigmaExport
    //         .filter(item => item.type === "margin")
    //         .map(variable => `--margin-${variable.variantName}: ${variable.resolvedValue}px;`);
    //
    //     themeCss = themeCss.replace("{MARGIN}", margin.join("\n    "));
    // }
    //
    // 9. Padding
    {
        const padding = normalizedFigmaExport
            .filter(item => item.type === "padding")
            .map(variable => `--padding-${variable.variantName}: ${variable.resolvedValue}px;`);

        themeCss = themeCss.replace("{PADDING}", padding.join("\n    "));
    }
    //
    // // 10. Ring color
    // {
    //     let currentRingColorGroup = null;
    //     const ringColors = normalizedFigmaExport
    //         .filter(item => item.type === "ringColor")
    //         .filter(variable => !isColorWithAlpha(variable.variantName))
    //         .map(variable => {
    //             const [colorGroup] = variable.variantName.split("-");
    //             const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
    //             const cssVar = `--ring-${variable.variantName}: var(--${cssVarName});`;
    //
    //             if (!currentRingColorGroup) {
    //                 currentRingColorGroup = colorGroup;
    //                 return cssVar;
    //             }
    //
    //             if (!currentRingColorGroup || currentRingColorGroup !== colorGroup) {
    //                 currentRingColorGroup = colorGroup;
    //                 return ["", cssVar];
    //             }
    //             return cssVar;
    //         })
    //         .flat();
    //
    //     themeCss = themeCss.replace("{RING_COLOR}", ringColors.join("\n    "));
    // }
    //
    // // 11. Ring width
    // {
    //     const ringWidth = normalizedFigmaExport
    //         .filter(item => item.type === "ringWidth")
    //         .map(variable => `--ring-width-${variable.variantName}: ${variable.resolvedValue}px;`);
    //
    //     themeCss = themeCss.replace("{RING_WIDTH}", ringWidth.join("\n    "));
    // }
    //
    // // 12. Shadow
    // {
    //     const shadow = normalizedFigmaExport
    //         .filter(item => item.type === "shadow")
    //         .map(variable => `--shadow-${variable.variantName}: ${variable.resolvedValue}px;`);
    //
    //     themeCss = themeCss.replace("{SHADOW}", shadow.join("\n    "));
    // }
    //
    // // 13. Spacing
    // {
    //     const spacing = normalizedFigmaExport
    //         .filter(item => item.type === "spacing")
    //         .map(variable => `--spacing-${variable.variantName}: ${variable.resolvedValue}px;`)
    //         .concat(
    //             `--spacing-sidebar-collapsed: 44px;`,
    //             `--spacing-sidebar-expanded: 256px;`,
    //             `--spacing-main-content: calc(100vh - 45px);`
    //         );
    //
    //     themeCss = themeCss.replace("{SPACING}", spacing.join("\n    "));
    // }

    // 14. Text color
    {
        let currentTextColor = null;
        const textColors = normalizedFigmaExport
            .filter(item => item.type === "textColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
                const cssVar = `--text-color-${variable.variantName}: hsl(var(--${cssVarName}));`;

                if (!currentTextColor) {
                    currentTextColor = colorGroup;
                    return cssVar;
                }

                if (!currentTextColor || currentTextColor !== colorGroup) {
                    currentTextColor = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        themeCss = themeCss.replace("{TEXT_COLOR}", textColors.join("\n    "));
    }

    // // 15. Text size
    // {
    //     const textSize = normalizedFigmaExport
    //         .filter(item => item.type === "textFont" && item.variantName.startsWith("font-size-"))
    //         .sort((a, b) => a.resolvedValue - b.resolvedValue)
    //         .reduce(
    //             (acc, { variantName, resolvedValue }) => {
    //                 const size = variantName.replace("font-size-", "");
    //                 const lineHeightItem = normalizedFigmaExport.find(item => {
    //                     return item.variantName === `line-height-${size}`;
    //                 });
    //                 const lineHeight = lineHeightItem ? lineHeightItem.resolvedValue : resolvedValue * 1.5;
    //
    //                 return [
    //                     ...acc,
    //                     [
    //                         `--text-${size}: ${resolvedValue}px;`,
    //                         `--text-${size}-leading: ${lineHeight}px;`,
    //                         `--text-${size}-tracking: initial;`,
    //                         `--text-${size}-weight: normal;`
    //                     ]
    //                 ];
    //             },
    //             [
    //                 [
    //                     `--text-h1: var(--text-4xl);`,
    //                     `--text-h1-leading: var(--text-4xl-leading);`,
    //                     `--text-h1-tracking: var(--text-4xl-tracking);`,
    //                     `--text-h1-weight: var(--font-weight-semibold);`
    //                 ],
    //                 [
    //                     `--text-h2: var(--text-3xl);`,
    //                     `--text-h2-leading: var(--text-3xl-leading);`,
    //                     `--text-h2-tracking: var(--text-3xl-tracking);`,
    //                     `--text-h2-weight: var(--font-weight-semibold);`
    //                 ],
    //                 [
    //                     `--text-h3: var(--text-xxl);`,
    //                     `--text-h3-leading: var(--text-xxl-leading);`,
    //                     `--text-h3-tracking: var(--text-xxl-tracking);`,
    //                     `--text-h3-weight: var(--font-weight-semibold);`
    //                 ],
    //                 [
    //                     `--text-h4: var(--text-xl);`,
    //                     `--text-h4-leading: var(--text-xl-leading);`,
    //                     `--text-h4-tracking: initial;`,
    //                     `--text-h4-weight: var(--font-weight-semibold);`
    //                 ],
    //                 [
    //                     `--text-h5: var(--text-lg);`,
    //                     `--text-h5-leading: var(--text-lg-leading);`,
    //                     `--text-h5-tracking: initial;`,
    //                     `--text-h5-weight: var(--font-weight-semibold);`
    //                 ],
    //                 [
    //                     `--text-h6: var(--text-md);`,
    //                     `--text-h6-leading: var(--text-md-leading);`,
    //                     `--text-h6-tracking: initial;`,
    //                     `--text-h6-weight: var(--font-weight-semibold);`
    //                 ]
    //             ]
    //         )
    //         .flat();
    //
    //     themeCss = themeCss.replace("{TEXT_SIZE}", textSize.join("\n    "));
    // }

    return themeCss;
};

export { createThemeCssV4 };

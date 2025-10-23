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

    // Color.
    {
        const colorMap = new Map();

        let currentBgColorGroup = null;
        normalizedPrimitivesFigmaExport
            .filter(item => item.type === "colors")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--color-${variable.variantName}: hsl(${variable.hsla.h} ${variable.hsla.s}% ${variable.hsla.l}%);`;

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
            .reverse()
            .forEach(colorVar => {
                const colorKey = colorVar.replace("--color-", "").split(":")[0].trim();
                if (!colorMap.has(colorKey)) {
                    colorMap.set(colorKey, colorVar);
                }
            });

        const colors = Array.from(colorMap.values());
        themeCss = themeCss.replace("{COLOR}", colors.join("\n  "));
    }

    // Border color.
    let currentBorderColor = null;
    const borderColors = normalizedFigmaExport
        .filter(item => item.type === "borderColor")
        .filter(variable => !isColorWithAlpha(variable.variantName))
        .map(variable => {
            const [colorGroup] = variable.variantName.split("-");
            const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
            const cssVar = `--border-color-${variable.variantName}: var(--${cssVarName});`;

            if (!currentBorderColor) {
                currentBorderColor = colorGroup;
                return cssVar;
            }

            if (!currentBorderColor || currentBorderColor !== colorGroup) {
                currentBorderColor = colorGroup;
                return ["", cssVar];
            }
            return cssVar;
        })
        .flat();

    themeCss = themeCss.replace("{THEME_BORDER_COLOR}", borderColors.join("\n  "));

    // Border radius.
    {
        const borderRadiusTheme = normalizedFigmaExport
            .filter(item => item.type === "borderRadius")
            .map(variable => {
                return `--radius-${variable.variantName}: ${variable.resolvedValue}px;`;
            });

        themeCss = themeCss.replace("{THEME_BORDER_RADIUS}", borderRadiusTheme.join("\n  "));
    }

    // Border width.
    const borderWidthTheme = normalizedFigmaExport
        .filter(item => item.type === "borderWidth")
        .map(variable => {
            return `--border-width-${variable.variantName}: ${variable.resolvedValue}px;`;
        });

    themeCss = themeCss.replace("{THEME_BORDER_WIDTH}", borderWidthTheme.join("\n  "));

    // Fill.
    let currentFillColorGroup = null;
    const fillColors = normalizedFigmaExport
        .filter(item => item.type === "fill")
        .filter(variable => !isColorWithAlpha(variable.variantName))
        .map(variable => {
            const [colorGroup] = variable.variantName.split("-");
            const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
            const cssVar = `--fill-${variable.variantName}: var(--${cssVarName});`;

            if (!currentFillColorGroup) {
                currentFillColorGroup = colorGroup;
                return cssVar;
            }

            if (!currentFillColorGroup || currentFillColorGroup !== colorGroup) {
                currentFillColorGroup = colorGroup;
                return ["", cssVar];
            }
            return cssVar;
        })
        .flat();

    themeCss = themeCss.replace("{FILL}", fillColors.join("\n  "));

    // Font.
    themeCss = themeCss.replace("{FONT}", `--font-sans: 'Inter', sans-serif;`);

    // Font weight.
    const weight = normalizedFigmaExport
        .filter(item => item.type === "textFont" && item.variantName.startsWith("font-weight-"))
        .map(variable => `--${variable.variantName}: ${variable.resolvedValue};`);

    themeCss = themeCss.replace("{FONT_WEIGHT}", weight.join("\n"));

    // Background color.
    {
        let currentBgColorGroup = null;
        const bgColors = normalizedFigmaExport
            .filter(item => item.type === "backgroundColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const variantName = variable.variantName.replace("-default", "");
                const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
                const cssVar = `--color-${variantName}: var(--${cssVarName});`;

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

        themeCss = themeCss.replace("{BG_COLOR}", bgColors.join("\n  "));
    }

    // Margin.
    const margin = normalizedFigmaExport
        .filter(item => item.type === "margin")
        .map(variable => `--margin-${variable.variantName}: ${variable.resolvedValue}px;`);

    themeCss = themeCss.replace("{THEME_MARGIN}", margin.join("\n"));

    // Padding.
    const padding = normalizedFigmaExport
        .filter(item => item.type === "padding")
        .map(variable => `--padding-${variable.variantName}: ${variable.resolvedValue}px;`);

    themeCss = themeCss.replace("{THEME_PADDING}", padding.join("\n"));

    // Ring color.
    {
        let currentRingColorGroup = null;
        const ringColors = normalizedFigmaExport
            .filter(item => item.type === "ringColor")
            .filter(variable => !isColorWithAlpha(variable.variantName))
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVarName = variable.aliasName.replace("colors/colors-", "color-");
                const cssVar = `--ring-color-${variable.variantName}: var(--${cssVarName});`;

                if (!currentRingColorGroup) {
                    currentRingColorGroup = colorGroup;
                    return cssVar;
                }

                if (!currentRingColorGroup || currentRingColorGroup !== colorGroup) {
                    currentRingColorGroup = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        themeCss = themeCss.replace("{RING_COLOR}", ringColors.join("\n"));
    }

    // Ring width.
    {
        const ringWidth = normalizedFigmaExport
            .filter(item => item.type === "ringWidth")
            .map(variable => `--ring-width-${variable.variantName}: ${variable.resolvedValue}px;`);

        themeCss = themeCss.replace("{RING_WIDTH}", ringWidth.join("\n"));
    }
    //
    // // 11. Shadow.
    // {
    //     const shadow = normalizedFigmaExport
    //         .filter(item => item.type === "shadow")
    //         .map(variable => `--shadow-${variable.variantName}: ${variable.resolvedValue}px;`);
    //
    //     stylesScss = stylesScss.replace("{SHADOW}", shadow.join("\n"));
    // }
    //
    // Spacing.
    const spacingTheme = normalizedFigmaExport
        .filter(item => item.type === "spacing")
        .map(variable => {
            return `--spacing-${variable.variantName}: ${variable.resolvedValue}px;`;
        });

    themeCss = themeCss.replace("{THEME_SPACING}", spacingTheme.join("\n  "));

    const spacingVars = normalizedFigmaExport
        .filter(item => item.type === "spacing")
        .map(variable => `--spacing-${variable.variantName}: ${variable.resolvedValue}px;`)
        .concat(
            `--spacing-sidebar-collapsed: 44px;`,
            `--spacing-sidebar-expanded: 256px;`,
            `--spacing-main-content: calc(100vh - 45px);`
        );

    themeCss = themeCss.replace("{SPACING}", spacingVars.join("\n    "));

    // Text / font.
    {
        const fontSizes = normalizedFigmaExport
            .filter(item => item.type === "textFont" && item.variantName.startsWith("font-size-"))
            .sort((a, b) => a.resolvedValue - b.resolvedValue)
            .map(({ variantName, resolvedValue }) => {
                const size = variantName.replace("font-size-", "");
                const lineHeightItem = normalizedFigmaExport.find(item => {
                    return item.variantName === `line-height-${size}`;
                });
                const lineHeight = lineHeightItem
                    ? lineHeightItem.resolvedValue
                    : resolvedValue * 1.5;

                return [
                    `--text-${size}: ${resolvedValue}px;`,
                    `--text-${size}--line-height: ${lineHeight}px;`,
                    `--text-${size}--letter-spacing: initial;`,
                    `--text-${size}--font-weight: normal;`
                ];
            })
            .flat()
            .concat(
                [
                    `--text-h1: var(--text-4xl);`,
                    `--text-h1--line-height: var(--text-4xl--line-height);`,
                    `--text-h1--letter-spacing: var(--text-4xl--letter-spacing);`,
                    `--text-h1--font-weight: var(--font-weight-semibold);`
                ],
                [
                    `--text-h2: var(--text-3xl);`,
                    `--text-h2--line-height: var(--text-3xl--line-height);`,
                    `--text-h2--letter-spacing: var(--text-3xl--letter-spacing);`,
                    `--text-h2--font-weight: var(--font-weight-semibold);`
                ],
                [
                    `--text-h3: var(--text-xxl);`,
                    `--text-h3--line-height: var(--text-xxl--line-height);`,
                    `--text-h3--letter-spacing: var(--text-xxl--letter-spacing);`,
                    `--text-h3--font-weight: var(--font-weight-semibold);`
                ],
                [
                    `--text-h4: var(--text-xl);`,
                    `--text-h4--line-height: var(--text-xl--line-height);`,
                    `--text-h4--letter-spacing: initial;`,
                    `--text-h4--font-weight: var(--font-weight-semibold);`
                ],
                [
                    `--text-h5: var(--text-lg);`,
                    `--text-h5--line-height: var(--text-lg--line-height);`,
                    `--text-h5--letter-spacing: initial;`,
                    `--text-h5--font-weight: var(--font-weight-semibold);`
                ],
                [
                    `--text-h6: var(--text-md);`,
                    `--text-h6--line-height: var(--text-md--line-height);`,
                    `--text-h6--letter-spacing: initial;`,
                    `--text-h6--font-weight: var(--font-weight-semibold);`
                ]
            );

        themeCss = themeCss.replace("{TEXT_SIZE}", fontSizes.join("\n  "));
    }

    //
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
                const cssVar = `--text-color-${variable.variantName}: var(--${cssVarName});`;

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

    return themeCss;
};

export { createThemeCssV4 };
